"""
Crépuscule Studio — serveur IA open source (optionnel).

Expose des modèles open source derrière une petite API HTTP que l'éditeur appelle
(onglet « Modèles IA » › Serveur IA). Chaque fonction n'est activée que si ses
dépendances sont installées : /health indique ce qui est disponible.

Lancer :  uvicorn app:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import importlib.util
import io
import json
import os
import shlex
import shutil
import subprocess
import tempfile
import threading
import urllib.request
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.background import BackgroundTask

VERSION = "2.0.0"
TOKEN = os.getenv("CREPUSCULE_TOKEN", "")
CACHE = Path(os.getenv("CREPUSCULE_CACHE", Path.home() / ".cache" / "crepuscule"))
CACHE.mkdir(parents=True, exist_ok=True)

# Models (override with environment variables). All open source, see MODELS.md for licences.
M = {
    "whisper": os.getenv("WHISPER_MODEL", "large-v3-turbo"),
    "image_edit": os.getenv("EDIT_MODEL", "Qwen/Qwen-Image-Edit-2511"),
    "image_gen": os.getenv("GEN_MODEL", "Tongyi-MAI/Z-Image-Turbo"),
    "img2video": os.getenv("I2V_MODEL", "Wan-AI/Wan2.2-TI2V-5B-Diffusers"),
    "rembg": os.getenv("REMBG_MODEL", "birefnet-general"),
    "esrgan_url": os.getenv(
        "ESRGAN_URL", "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
    ),
    "ollama_url": os.getenv("OLLAMA_URL", "http://localhost:11434"),
    "ollama_model": os.getenv("OLLAMA_MODEL", "qwen3:8b"),
    "acestep_cmd": os.getenv("ACESTEP_CMD", ""),  # e.g. "python /opt/ACE-Step/infer.py --prompt {prompt} --duration {seconds} --output {out}"
    "piper_voice": os.getenv("PIPER_VOICE", ""),  # path to fr_FR-*.onnx for the light TTS fallback
}
LOW_VRAM = os.getenv("LOW_VRAM", "1") == "1"

app = FastAPI(title="Crépuscule Studio AI server", version=VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
GPU_LOCK = threading.Lock()
_loaded: dict[str, object] = {}


def auth(authorization: str | None = Header(default=None)):
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(401, "Jeton invalide")


def has(mod: str) -> bool:
    try:
        return importlib.util.find_spec(mod) is not None
    except (ImportError, ValueError):
        return False


FFMPEG = shutil.which("ffmpeg")


def _ffmpeg_filters() -> str:
    if not FFMPEG:
        return ""
    try:
        return subprocess.run([FFMPEG, "-hide_banner", "-filters"], capture_output=True, text=True, timeout=20).stdout
    except Exception:
        return ""


FILTERS = _ffmpeg_filters()


def ollama_ok() -> bool:
    try:
        with urllib.request.urlopen(M["ollama_url"] + "/api/tags", timeout=1.5) as r:
            return r.status == 200
    except Exception:
        return False


def capabilities() -> dict[str, bool]:
    diff = has("diffusers") and has("torch")
    return {
        "transcribe": has("faster_whisper"),
        "tts": has("chatterbox") or bool(shutil.which("piper") and M["piper_voice"]),
        "image_edit": diff,
        "image_gen": diff,
        "img2video": diff,
        "music": bool(M["acestep_cmd"]),
        "stems": has("demucs"),
        "denoise": has("df"),
        "upscale": has("spandrel") and has("torch"),
        "remove_bg": has("rembg"),
        "llm": ollama_ok(),
        "stabilize": bool(FFMPEG),
        "convert": bool(FFMPEG),
    }


def device() -> str:
    if not has("torch"):
        return "none"
    import torch

    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def need(cap: str):
    if not capabilities().get(cap):
        raise HTTPException(503, f"Fonction « {cap} » non installée sur ce serveur. Voir server/README.md.")


async def save_upload(f: UploadFile, suffix: str = "") -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="crep-"))
    name = Path(f.filename or "input").name
    p = tmp / (name if Path(name).suffix else name + suffix)
    with p.open("wb") as out:
        while chunk := await f.read(1 << 20):
            out.write(chunk)
    return p


def cleanup(*paths: Path):
    for p in paths:
        shutil.rmtree(p if p.is_dir() else p.parent, ignore_errors=True)


def file_response(path: Path, media: str, *cleanup_paths: Path) -> FileResponse:
    return FileResponse(path, media_type=media, background=BackgroundTask(cleanup, *cleanup_paths, path))


def ff(*args: str, timeout: int = 3600):
    if not FFMPEG:
        raise HTTPException(503, "FFmpeg introuvable")
    r = subprocess.run([FFMPEG, "-hide_banner", "-y", *args], capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise HTTPException(500, "FFmpeg : " + r.stderr[-600:])


def free_gpu(key: str | None = None):
    if not LOW_VRAM:
        return
    if key:
        _loaded.pop(key, None)
    try:
        import gc

        import torch

        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass


def diffusion(key: str, model_id: str):
    if key in _loaded:
        return _loaded[key]
    import torch
    from diffusers import DiffusionPipeline

    dev = device()
    dtype = torch.bfloat16 if dev == "cuda" else torch.float32
    pipe = DiffusionPipeline.from_pretrained(model_id, torch_dtype=dtype)
    if dev == "cuda" and LOW_VRAM:
        pipe.enable_model_cpu_offload()
    else:
        pipe.to(dev)
    _loaded[key] = pipe
    return pipe


def load_image(p: Path):
    from PIL import Image, ImageOps

    return ImageOps.exif_transpose(Image.open(p)).convert("RGB")


def png(img) -> Response:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(buf.getvalue(), media_type="image/png")


# ---------------------------------------------------------------- health
@app.get("/health")
def health():
    return {
        "app": "crepuscule-ai",
        "version": VERSION,
        "device": device(),
        "capabilities": capabilities(),
        "models": {k: v for k, v in M.items() if not k.endswith("_cmd")},
    }


# ---------------------------------------------------------------- audio
@app.post("/audio/transcribe", dependencies=[Depends(auth)])
async def transcribe(file: UploadFile = File(...), language: str = Form(""), start: float = Form(0), end: float = Form(0)):
    """faster-whisper (MIT) with word timestamps. Returns {"words":[{word,start,end}], "text"}."""
    need("transcribe")
    src = await save_upload(file)
    wav = src.with_suffix(".16k.wav")
    rng = ["-ss", str(start)] + (["-to", str(end)] if end > start else [])
    ff(*rng, "-i", str(src), "-vn", "-ac", "1", "-ar", "16000", str(wav))
    with GPU_LOCK:
        if "whisper" not in _loaded:
            from faster_whisper import WhisperModel

            dev = "cuda" if device() == "cuda" else "cpu"
            _loaded["whisper"] = WhisperModel(M["whisper"], device=dev, compute_type="float16" if dev == "cuda" else "int8")
        segs, _info = _loaded["whisper"].transcribe(str(wav), language=language or None, word_timestamps=True, vad_filter=True)
        words = [
            {"word": w.word, "start": round(w.start + start, 3), "end": round(w.end + start, 3)}
            for s in segs
            for w in (s.words or [])
        ]
    cleanup(src)
    return {"words": words, "text": "".join(w["word"] for w in words).strip()}


@app.post("/audio/tts", dependencies=[Depends(auth)])
async def tts(text: str = Form(...), lang: str = Form("fr"), voice: UploadFile | None = File(None)):
    """Chatterbox Multilingual (MIT, voice cloning with a reference clip) or Piper (MIT) fallback."""
    need("tts")
    ref = await save_upload(voice, ".wav") if voice else None
    out = Path(tempfile.mkdtemp(prefix="crep-")) / "voice.wav"
    if has("chatterbox"):
        with GPU_LOCK:
            import torchaudio

            if "chatterbox" not in _loaded:
                from chatterbox.mtl_tts import ChatterboxMultilingualTTS

                _loaded["chatterbox"] = ChatterboxMultilingualTTS.from_pretrained(device=device() if device() != "none" else "cpu")
            model = _loaded["chatterbox"]
            wav = model.generate(text, language_id=lang, **({"audio_prompt_path": str(ref)} if ref else {}))
            torchaudio.save(str(out), wav, model.sr)
    else:
        r = subprocess.run(["piper", "-m", M["piper_voice"], "-f", str(out)], input=text, text=True, capture_output=True, timeout=600)
        if r.returncode != 0:
            raise HTTPException(500, "Piper : " + r.stderr[-400:])
    return file_response(out, "audio/wav", *( [ref] if ref else [] ))


@app.post("/audio/denoise", dependencies=[Depends(auth)])
async def denoise(file: UploadFile = File(...)):
    """DeepFilterNet 3 (MIT/Apache-2.0)."""
    need("denoise")
    src = await save_upload(file)
    wav = src.with_suffix(".48k.wav")
    ff("-i", str(src), "-vn", "-ac", "1", "-ar", "48000", str(wav))
    from df.enhance import enhance, init_df, load_audio, save_audio

    with GPU_LOCK:
        if "dfn" not in _loaded:
            _loaded["dfn"] = init_df()
        model, state, _ = _loaded["dfn"]
        audio, _ = load_audio(str(wav), sr=state.sr())
        out = src.with_suffix(".clean.wav")
        save_audio(str(out), enhance(model, state, audio), state.sr())
    return file_response(out, "audio/wav", src)


@app.post("/audio/stems", dependencies=[Depends(auth)])
async def stems(file: UploadFile = File(...), stem: str = Form("vocals")):
    """Demucs v4 (MIT). stem = vocals | no_vocals."""
    need("stems")
    src = await save_upload(file)
    wav = src.with_suffix(".wav")
    ff("-i", str(src), "-vn", "-ac", "2", "-ar", "44100", str(wav))
    outdir = src.parent / "sep"
    with GPU_LOCK:
        r = subprocess.run(
            ["python", "-m", "demucs", "--two-stems=vocals", "-o", str(outdir), str(wav)], capture_output=True, text=True, timeout=3600
        )
    if r.returncode != 0:
        raise HTTPException(500, "Demucs : " + r.stderr[-400:])
    found = list(outdir.rglob(("no_vocals" if stem == "no_vocals" else "vocals") + ".wav"))
    if not found:
        raise HTTPException(500, "Demucs n'a produit aucun fichier")
    return file_response(found[0], "audio/wav", src)


@app.post("/audio/music", dependencies=[Depends(auth)])
async def music(prompt: str = Form(...), seconds: int = Form(30)):
    """ACE-Step 1.5 (Apache-2.0) through the command configured in ACESTEP_CMD."""
    need("music")
    out = Path(tempfile.mkdtemp(prefix="crep-")) / "music.wav"
    cmd = M["acestep_cmd"].format(prompt=shlex.quote(prompt), seconds=int(max(5, min(seconds, 240))), out=shlex.quote(str(out)))
    with GPU_LOCK:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=3600)
    if r.returncode != 0 or not out.exists():
        raise HTTPException(500, "ACE-Step : " + (r.stderr or r.stdout)[-400:])
    return file_response(out, "audio/wav")


# ---------------------------------------------------------------- images
@app.post("/image/edit", dependencies=[Depends(auth)])
async def image_edit(file: UploadFile = File(...), prompt: str = Form(...), steps: int = Form(30)):
    """Qwen-Image-Edit-2511 (Apache-2.0): twilight, virtual staging, decluttering, sky…"""
    need("image_edit")
    src = await save_upload(file)
    img = load_image(src)
    with GPU_LOCK:
        pipe = diffusion("image_edit", M["image_edit"])
        out = pipe(image=img, prompt=prompt, num_inference_steps=steps).images[0]
        free_gpu("image_edit")
    cleanup(src)
    if out.size != img.size:
        out = out.resize(img.size)
    return png(out)


@app.post("/image/generate", dependencies=[Depends(auth)])
async def image_generate(prompt: str = Form(...), width: int = Form(1344), height: int = Form(768), steps: int = Form(9)):
    """Z-Image Turbo (Apache-2.0) by default; set GEN_MODEL for FLUX.2 klein 4B (Apache-2.0)."""
    need("image_gen")
    with GPU_LOCK:
        pipe = diffusion("image_gen", M["image_gen"])
        out = pipe(prompt=prompt, width=width // 16 * 16, height=height // 16 * 16, num_inference_steps=steps).images[0]
        free_gpu("image_gen")
    return png(out)


@app.post("/image/remove-bg", dependencies=[Depends(auth)])
async def remove_bg(file: UploadFile = File(...)):
    """rembg (MIT) with BiRefNet (MIT)."""
    need("remove_bg")
    from rembg import new_session, remove

    src = await save_upload(file)
    if "rembg" not in _loaded:
        _loaded["rembg"] = new_session(M["rembg"])
    from PIL import Image

    out = remove(Image.open(src), session=_loaded["rembg"])
    cleanup(src)
    return png(out)


@app.post("/image/upscale", dependencies=[Depends(auth)])
async def upscale(file: UploadFile = File(...), scale: int = Form(4)):
    """Real-ESRGAN x4 (BSD-3-Clause) loaded with spandrel (MIT)."""
    need("upscale")
    import numpy as np
    import torch
    from PIL import Image
    from spandrel import ModelLoader

    weights = CACHE / Path(M["esrgan_url"]).name
    if not weights.exists():
        urllib.request.urlretrieve(M["esrgan_url"], weights)
    src = await save_upload(file)
    img = load_image(src)
    with GPU_LOCK:
        if "esrgan" not in _loaded:
            dev = device() if device() in ("cuda", "mps") else "cpu"
            _loaded["esrgan"] = ModelLoader().load_from_file(str(weights)).to(dev).eval()
        model = _loaded["esrgan"]
        x = torch.from_numpy(np.asarray(img).astype("float32") / 255).permute(2, 0, 1)[None].to(model.device)
        with torch.no_grad():
            y = model(x).clamp(0, 1)[0].permute(1, 2, 0).cpu().numpy()
    out = Image.fromarray((y * 255).round().astype("uint8"))
    if scale != 4:
        out = out.resize((img.width * scale, img.height * scale), Image.LANCZOS)
    cleanup(src)
    return png(out)


# ---------------------------------------------------------------- video
@app.post("/video/image-to-video", dependencies=[Depends(auth)])
async def image_to_video(file: UploadFile = File(...), prompt: str = Form(...), seconds: float = Form(5)):
    """Wan 2.2 TI2V-5B (Apache-2.0) by default — needs about 24 GB of VRAM (less with offload, slower)."""
    need("img2video")
    from diffusers.utils import export_to_video

    src = await save_upload(file)
    img = load_image(src)
    w, h = img.size
    k = (1280 * 704 / (w * h)) ** 0.5
    w, h = int(w * k) // 32 * 32, int(h * k) // 32 * 32
    frames = int(max(1, min(seconds, 8)) * 24) // 4 * 4 + 1
    with GPU_LOCK:
        pipe = diffusion("img2video", M["img2video"])
        out = pipe(image=img.resize((w, h)), prompt=prompt, height=h, width=w, num_frames=frames, num_inference_steps=40).frames[0]
        free_gpu("img2video")
    dst = src.with_suffix(".mp4")
    export_to_video(out, str(dst), fps=24)
    return file_response(dst, "video/mp4")


@app.post("/video/stabilize", dependencies=[Depends(auth)])
async def stabilize(file: UploadFile = File(...)):
    """FFmpeg vidstab (two passes) when available, otherwise deshake."""
    need("stabilize")
    src = await save_upload(file)
    dst = src.with_suffix(".stab.mp4")
    if "vidstabdetect" in FILTERS:
        trf = src.with_suffix(".trf")
        ff("-i", str(src), "-vf", f"vidstabdetect=shakiness=6:accuracy=15:result={trf}", "-f", "null", "-")
        vf = f"vidstabtransform=input={trf}:smoothing=20:zoom=2,unsharp=5:5:0.6:3:3:0.3"
    else:
        vf = "deshake"
    ff("-i", str(src), "-vf", vf, "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", str(dst))
    return file_response(dst, "video/mp4", src)


@app.post("/video/interpolate", dependencies=[Depends(auth)])
async def interpolate(file: UploadFile = File(...), fps: int = Form(60)):
    """Motion-compensated frame interpolation (FFmpeg minterpolate) for smooth slow motion."""
    need("stabilize")
    src = await save_upload(file)
    dst = src.with_suffix(f".{fps}fps.mp4")
    ff("-i", str(src), "-vf", f"minterpolate=fps={int(fps)}:mi_mode=mci:mc_mode=aobmc:vsbmc=1", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", str(dst))
    return file_response(dst, "video/mp4", src)


@app.post("/video/convert", dependencies=[Depends(auth)])
async def convert(file: UploadFile = File(...), loudnorm: str = Form("-14")):
    """Final delivery: H.264 + AAC MP4, loudness normalised (EBU R128, -14 LUFS for YouTube/Instagram)."""
    need("convert")
    src = await save_upload(file)
    dst = src.with_suffix(".final.mp4")
    af = ["-af", f"loudnorm=I={float(loudnorm)}:TP=-1.5:LRA=11"] if loudnorm else []
    ff("-i", str(src), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", *af, "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(dst))
    return file_response(dst, "video/mp4", src)


# ---------------------------------------------------------------- text
@app.post("/llm", dependencies=[Depends(auth)])
async def llm(prompt: str = Form(...), system: str = Form("Tu es un rédacteur immobilier français. Réponds en français, sans préambule.")):
    """Any open model served by Ollama (Qwen3, Mistral Small, Llama…)."""
    need("llm")
    body = json.dumps({"model": M["ollama_model"], "system": system, "prompt": prompt, "stream": False, "think": False}).encode()
    req = urllib.request.Request(M["ollama_url"] + "/api/generate", data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            data = json.loads(r.read())
    except Exception as e:  # noqa: BLE001
        raise HTTPException(502, f"Ollama : {e}") from e
    return JSONResponse({"text": data.get("response", "").strip()})
