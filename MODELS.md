# Modèles open source intégrés

Vérifié en octobre 2026. Toutes les licences ci-dessous autorisent l'usage commercial, sauf mention contraire. Vérifiez toujours la fiche du modèle avant un usage professionnel : les licences peuvent évoluer.

## Dans le navigateur (aucun serveur)

Téléchargés depuis Hugging Face à la première utilisation, puis mis en cache. Moteur : [Transformers.js](https://github.com/huggingface/transformers.js) 4.3.0 (Apache-2.0) et [Piper](https://github.com/rhasspy/piper) via [piper-tts-web](https://github.com/Mintplex-Labs/piper-tts-web) 1.0.5 (MIT).

| Fonction | Modèle | Licence |
|---|---|---|
| Sous-titres mot à mot | `onnx-community/whisper-base_timestamped` (Whisper, OpenAI) | MIT |
| Photo 3D (profondeur) | `onnx-community/depth-anything-v2-small` | Apache-2.0 |
| Détourage | `onnx-community/BiRefNet_lite-ONNX` | MIT |
| Agrandissement ×2 | `Xenova/swin2SR-classical-sr-x2-64` | Apache-2.0 |
| Voix off française | Piper `fr_FR-siwis / tom / upmc / gilles / mls` | MIT (moteur) ; chaque voix a sa propre licence, voir [piper-voices](https://huggingface.co/rhasspy/piper-voices) |
| Rédaction (WebGPU) | `onnx-community/Qwen3-0.6B-ONNX` | Apache-2.0 |

Sans aucun modèle, l'appli calcule elle-même (WebGL / Web Audio) : Jour → Nuit, ciel bleu, fenêtres allumées, HDR, parallaxe 3D estimée, détection du tempo, découpe des silences, détection de plans, classement intérieur / extérieur.

## Sur le serveur IA (`server/`, GPU conseillé)

| Fonction | Modèle | Licence | Matériel indicatif |
|---|---|---|---|
| Transcription longue durée | [faster-whisper](https://github.com/SYSTRAN/faster-whisper) `large-v3-turbo` | MIT | GPU 6 Go ou CPU |
| Voix off FR + clonage | [Chatterbox Multilingual](https://github.com/resemble-ai/chatterbox) | MIT | GPU 8 Go |
| Nuit photoréaliste, home staging, désencombrement | [Qwen-Image-Edit-2511](https://github.com/QwenLM/Qwen-Image) | Apache-2.0 | GPU 24 Go+ (offload) |
| Génération d'images | [Z-Image Turbo](https://github.com/Tongyi-MAI/Z-Image) ou FLUX.2 klein **4B** | Apache-2.0 | GPU 12–16 Go |
| Photo → vidéo | [Wan 2.2 TI2V-5B](https://github.com/Wan-Video/Wan2.2) | Apache-2.0 | GPU 24 Go |
| Photo → vidéo HQ | Wan 2.2 I2V-A14B | Apache-2.0 | GPU 80 Go |
| Texte → vidéo léger | [CogVideoX-2B](https://github.com/THUDM/CogVideo) | Apache-2.0 | GPU 12 Go+ |
| Vidéo + son | [LTX-2.3](https://huggingface.co/Lightricks/LTX-2.3) | LTX-2 Community : gratuit sous ≈ 10 M$ de CA annuel | GPU 32 Go+ |
| Musique | [ACE-Step 1.5](https://github.com/ace-step/ACE-Step) | Apache-2.0 | GPU 8 Go+ |
| Séparation voix / musique | [Demucs v4](https://github.com/facebookresearch/demucs) | MIT | GPU ou CPU |
| Débruitage voix | [DeepFilterNet 3](https://github.com/Rikorose/DeepFilterNet) | MIT / Apache-2.0 | CPU |
| Agrandissement ×4 | [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) via spandrel | BSD-3-Clause | GPU ou CPU |
| Détourage HD | [rembg](https://github.com/danielgatis/rembg) + BiRefNet | MIT | CPU / GPU |
| Scripts, titres, traductions | Qwen3 / Mistral Small via [Ollama](https://github.com/ollama/ollama) | Apache-2.0 / MIT | GPU 8 Go+ ou CPU |
| Stabilisation, ralenti fluide, MP4 final −14 LUFS | [FFmpeg](https://ffmpeg.org) (vidstab, minterpolate, loudnorm) | LGPL / GPL | CPU |

Changer de modèle : variables d'environnement `WHISPER_MODEL`, `EDIT_MODEL`, `GEN_MODEL`, `I2V_MODEL`, `OLLAMA_MODEL`, `ACESTEP_CMD` (voir `server/README.md`).

## Volontairement non intégrés

| Modèle | Raison |
|---|---|
| HunyuanVideo 1.5 | Licence Tencent excluant l'Union européenne, le Royaume-Uni et la Corée du Sud : inutilisable en France |
| FLUX.2 dev, FLUX.2 klein 9B | FLUX Non-Commercial License (déploiement payant) |
| F5-TTS (poids), XTTS-v2, MusicGen | Poids non commerciaux (CC-BY-NC / CPML) |
| RMBG-2.0, Depth Anything V2 Large | Non commerciaux (CC-BY-NC) |
| Modèles « leakés », crackés ou contournant des API payantes | Illégaux et risqués : non intégrés |
