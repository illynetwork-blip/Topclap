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

### Modèles chinois open source utilisables sur le serveur

| Modèle | Éditeur | Usage | Licence |
|---|---|---|---|
| Qwen3, Qwen-Image, Qwen-Image-Edit-2511 | Alibaba | Rédaction, images, retouche | Apache-2.0 |
| Wan 2.2 (TI2V-5B, I2V-A14B) | Alibaba | Photo → vidéo, texte → vidéo | Apache-2.0 |
| Z-Image Turbo | Alibaba (Tongyi) | Images | Apache-2.0 |
| CosyVoice 2 | Alibaba | Voix off, clonage | Apache-2.0 |
| MAGI-1 | Sand AI | Vidéo longue | Apache-2.0 |
| Step-Video-T2V, ACE-Step 1.5 | StepFun | Vidéo, musique | MIT, Apache-2.0 |
| HiDream-I1 | HiDream.ai | Images | MIT |
| CogVideoX-2B | Zhipu | Texte → vidéo | Apache-2.0 |
| GLM-4.5 | Zhipu | Rédaction | MIT |
| DeepSeek R1 / V3 | DeepSeek | Rédaction, raisonnement | MIT |
| Kimi K2 | Moonshot | Rédaction (aussi via Groq) | MIT modifiée |
| SkyReels V2 | Skywork | Vidéo longue | à vérifier sur la fiche du modèle |

Pour l'image et la vidéo, renseignez l'identifiant Hugging Face du modèle dans `GEN_MODEL`, `EDIT_MODEL` ou `I2V_MODEL` ; le serveur le charge avec `diffusers` quand le modèle y est intégré. Les modèles de rédaction se téléchargent avec Ollama (`ollama pull qwen3`, `deepseek-r1`, `glm4`…).

## Services gratuits en ligne (choix automatique dans l'appli)

Onglet **Modèles IA › Moteurs** : pour chaque tâche, mode **Automatique** (le meilleur moteur disponible, avec repli sur le suivant en cas d'échec ou de quota épuisé) ou choix manuel. Les clés restent dans votre navigateur. Vérifié en octobre 2026 ; les offres gratuites changent souvent.

| Service | Pays | Compte | Ce que Top Clap utilise | Limites constatées |
|---|---|---|---|---|
| [Groq](https://console.groq.com) | USA | Gratuit | Whisper large-v3-turbo (sous-titres mot à mot), Qwen3 32B, Kimi K2, Llama | ≈ 2 000 transcriptions et 1 000 à 14 400 requêtes texte par jour selon le modèle |
| [Zhipu GLM](https://open.bigmodel.cn) (BigModel / Z.ai) | Chine | Gratuit | GLM-4.7-Flash, CogView-3-Flash (images), CogVideoX-Flash (texte → vidéo et photo → vidéo) | Modèles « Flash » gratuits, débit limité ; inscription BigModel avec numéro chinois, Z.ai par e-mail |
| [SiliconFlow](https://cloud.siliconflow.cn) | Chine | Gratuit, vérification téléphone | Qwen 2.5, Kolors (images), SenseVoice (transcription) | Modèles gratuits à quotas ; liste à vérifier sur `/v1/models` |
| [Google Gemini](https://aistudio.google.com) | USA | Gratuit | Texte, voix off (modèle choisi automatiquement) | Quotas par modèle ; images et vidéo Veo payantes ; Google peut utiliser les données de l'offre gratuite |
| [OpenRouter](https://openrouter.ai) | USA | Gratuit | Meilleur modèle « :free » disponible (DeepSeek, Qwen, GLM…) choisi automatiquement | 50 requêtes/jour, 1 000 après un achat de 10 crédits |
| [Pollinations](https://github.com/pollinations/pollinations) | International | Gratuit (clé) | Images (FLUX, Seedream, Qwen-Image…), vidéo (Wan, Seedance…), voix (dont voix françaises), Whisper, musique | Fonctionne avec des crédits « pollen » : une clé est désormais nécessaire |
| [Hugging Face Spaces](https://huggingface.co/spaces) | USA | Aucun (token facultatif) | FLUX.1 schnell, Qwen-Image-Edit, Wan 2.2 I2V et T2V, Chatterbox multilingue, ACE-Step | ZeroGPU : ≈ 2 min de GPU/jour sans compte, 5 min avec un compte gratuit ; files d'attente possibles |

N'importe quel Space Gradio peut remplacer ceux par défaut : Top Clap lit son API et remplit automatiquement l'image, le texte, la langue et la durée.

**Studios vidéo IA gratuits (web, sans API gratuite)** : Kling, Hailuo (MiniMax), Vidu, Dreamina / Jimeng (ByteDance), Wan, Qwen Chat, Google Flow / Veo, Luma, Pika. Crédits quotidiens ou mensuels, filigrane et usage commercial souvent interdit en version gratuite. L'appli copie votre prompt et ouvre le site ; importez ensuite le plan généré.

**Ce qui n'est pas intégré** : les API payantes présentées comme gratuites, les clés partagées, les contournements de quotas ou de filigranes et les modèles « fuités » : illégaux, instables et risqués pour vos comptes.

## Volontairement non intégrés

| Modèle | Raison |
|---|---|
| HunyuanVideo 1.5 | Licence Tencent excluant l'Union européenne, le Royaume-Uni et la Corée du Sud : inutilisable en France |
| FLUX.2 dev, FLUX.2 klein 9B | FLUX Non-Commercial License (déploiement payant) |
| F5-TTS (poids), XTTS-v2, MusicGen | Poids non commerciaux (CC-BY-NC / CPML) |
| RMBG-2.0, Depth Anything V2 Large | Non commerciaux (CC-BY-NC) |
| Modèles « leakés », crackés ou contournant des API payantes | Illégaux et risqués : non intégrés |
