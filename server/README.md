# Serveur IA Crépuscule (optionnel)

Petite API FastAPI qui fait tourner des modèles open source trop lourds pour le navigateur. L'éditeur s'y connecte depuis **Modèles IA › Serveur IA**.

## Démarrage rapide

```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt            # base : FFmpeg requis (stabilisation, ralenti, MP4 final)
pip install -r requirements-ai.txt         # modèles IA (GPU NVIDIA conseillé), installez ce dont vous avez besoin
uvicorn app:app --host 127.0.0.1 --port 8000
```

Puis dans l'éditeur : adresse `http://localhost:8000` → **Connecter et tester**.

Avec Docker (GPU NVIDIA + Ollama inclus) : `docker compose up -d`, puis `docker compose exec ollama ollama pull qwen3:8b`.

## Fonctions

| Route | Fonction | Dépendance |
|---|---|---|
| `GET /health` | Fonctions disponibles | — |
| `POST /audio/transcribe` | Transcription mot à mot | `faster-whisper` |
| `POST /audio/tts` | Voix off FR (clonage avec un extrait `voice`) | `chatterbox-tts` ou `piper` + `PIPER_VOICE` |
| `POST /audio/denoise` | Débruitage | `deepfilternet` |
| `POST /audio/stems` | Isoler la voix | `demucs` |
| `POST /audio/music` | Musique ACE-Step | `ACESTEP_CMD` |
| `POST /image/edit` | Nuit photoréaliste, home staging… | `diffusers` + Qwen-Image-Edit-2511 |
| `POST /image/generate` | Génération d'images | `diffusers` + Z-Image Turbo |
| `POST /image/remove-bg` | Détourage | `rembg` |
| `POST /image/upscale` | Agrandissement ×4 | `spandrel` (Real-ESRGAN) |
| `POST /video/image-to-video` | Photo → vidéo | `diffusers` + Wan 2.2 TI2V-5B |
| `POST /video/stabilize` | Stabilisation | FFmpeg (vidstab si disponible) |
| `POST /video/interpolate` | Ralenti fluide 60 i/s | FFmpeg |
| `POST /video/convert` | MP4 H.264 + volume −14 LUFS | FFmpeg |
| `POST /llm` | Rédaction | Ollama |

## Configuration (variables d'environnement)

| Variable | Défaut |
|---|---|
| `CREPUSCULE_TOKEN` | vide (aucune authentification) — **à définir si le serveur est accessible par d'autres** |
| `CORS_ORIGINS` | `*` — mettez l'adresse de votre éditeur, ex. `https://illynetwork-blip.github.io` |
| `WHISPER_MODEL` | `large-v3-turbo` |
| `EDIT_MODEL` | `Qwen/Qwen-Image-Edit-2511` |
| `GEN_MODEL` | `Tongyi-MAI/Z-Image-Turbo` (ou `black-forest-labs/FLUX.2-klein-4B`) |
| `I2V_MODEL` | `Wan-AI/Wan2.2-TI2V-5B-Diffusers` |
| `OLLAMA_URL` / `OLLAMA_MODEL` | `http://localhost:11434` / `qwen3:8b` |
| `ACESTEP_CMD` | vide ; ex. `python /opt/ACE-Step/infer.py --prompt {prompt} --duration {seconds} --output {out}` (adaptez à la version installée d'ACE-Step) |
| `PIPER_VOICE` | chemin d'un `fr_FR-*.onnx` pour la voix légère |
| `LOW_VRAM` | `1` : déchargement CPU et libération mémoire entre les tâches |

Les gros modèles se téléchargent depuis Hugging Face à la première requête (plusieurs dizaines de Go pour la vidéo). Les appels peuvent durer plusieurs minutes.
