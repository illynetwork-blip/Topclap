<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/png/logo-horizontal.png">
    <img src="brand/png/logo-horizontal-clair.png" alt="Top Clap — éditeur vidéo" width="460">
  </picture>
</p>

<p align="center"><b>Créez · Montez · Partagez</b> — donnez vie à vos idées.</p>

<p align="center">
  👉 <a href="https://illynetwork-blip.github.io/Topclap/"><b>Ouvrir l'application</b></a>
</p>

---

**Top Clap** est un éditeur vidéo **open source** qui s'ouvre dans le navigateur, sur **ordinateur, tablette et téléphone**, et s'installe comme une vraie appli. Inspiré de CapCut, Edits, DaVinci Resolve, Premiere Pro et After Effects, il crée automatiquement des vidéos **YouTube, Reels, TikTok et Facebook**, avec un mode spécial **immobilier**.

- Aucun compte. Vos projets et médias restent **sur votre appareil**.
- Toutes les **IA gratuites** sélectionnables, en **mode automatique** : votre serveur, les services gratuits en ligne, les modèles du navigateur (dont les modèles chinois Qwen, Wan, Kimi, DeepSeek, GLM).
- Licence **MIT**.

## Installer sur l'appareil

Ouvrez le lien ci-dessus, puis :
- **Ordinateur** (Chrome, Edge) : bouton **Installer l'appli** sur l'écran d'accueil de Top Clap, ou icône d'installation dans la barre d'adresse. Top Clap apparaît dans le menu **Démarrer** / le Dock.
- **Android** : menu **Installer l'application**.
- **iPhone / iPad** : **Partager** puis **Sur l'écran d'accueil**.

Une fois installé, Top Clap s'ouvre même hors ligne (les fonctions IA en ligne demandent une connexion).

## Ce que fait Top Clap

- **Écran Démarrer** : reprendre un projet, assistant vidéo, nouveau projet, import, **bibliothèque de projets** (ouvrir, dupliquer, supprimer).
- **Assistant vidéo** : annonce immobilière, Reel / Short / TikTok, visite guidée, YouTube, avant / après, face caméra. Montage, textes, voix off, sous-titres, musique et formats générés.
- **Modèles tendance** en un clic : room tour express, « devinez le prix », top 5 des atouts, avant / après, visite cinématique, teaser 15 s, visite YouTube complète.
- **Vérifier ma vidéo** : accroche, sous-titres, zones masquées par TikTok / Reels, plans trop longs, trous noirs, appel à l'action, droits de la musique, photos floues, lisibilité des textes, **DPE et honoraires** pour les annonces, avec corrections en un clic.
- **Montage** : timeline multipiste magnétique, marqueurs, J / K / L, couper, rogner, aimantation, écran partagé 2 / 4 vues, arrêt sur image, calque de réglage.
- **Animation** : images clés (position, échelle, rotation, opacité) avec 7 courbes (douce, décélération, accélération, linéaire, dépassement, rebond, maintien), 13 animations de texte, sous-titres mot à mot (karaoké, encadré, pop, classique, élégant).
- **Étalonnage** : roues ombres / tons moyens / hautes lumières, **courbes RVB**, LUT `.cube`, 14 filtres, netteté, scopes, masques, fond vert.
- **Immobilier** : jour → nuit, ciel bleu, fenêtres allumées, golden hour, HDR, hiver, photo 3D, avant / après, drone cinématique.
- **Audio** : musiques libres intégrées, voix off (micro ou IA), ducking, voix claire, normalisation, détection du tempo.
- **Vision IA sur l'appareil** : retrait de l'arrière-plan d'une personne, floutage automatique des visages, recadrage automatique sur le sujet (MediaPipe).
- **Enregistrer** : caméra ou écran avec prompteur défilant, directement dans la timeline. Émojis et stickers.
- **Export** : MP4 / WebM jusqu'en 4K, tous les formats à la suite (16:9, 9:16, 4:5, 1:1), miniature YouTube, textes réseaux sociaux, sous-titres `.srt`.

## IA gratuites (choix automatique)

Pour chaque tâche, Top Clap choisit le meilleur moteur gratuit disponible et passe au suivant en cas d'échec ou de quota épuisé. Vous pouvez aussi imposer un moteur (onglet **Modèles IA › Moteurs**). IA chinoises comprises (Qwen, Wan, GLM, CogVideoX, Kolors, SenseVoice, Kimi, DeepSeek, ACE-Step).

| Tâche | Moteurs (ordre automatique) |
|---|---|
| Rédaction | Votre serveur (Ollama) → Groq (Qwen3, Kimi) → Zhipu GLM-4.7-Flash → Gemini → OpenRouter (meilleur modèle gratuit) → SiliconFlow Qwen → Pollinations → Qwen3 dans le navigateur |
| Sous-titres | Votre serveur (faster-whisper) → Groq Whisper turbo → SiliconFlow SenseVoice → Pollinations Whisper → Whisper dans le navigateur |
| Voix off | Votre serveur (Chatterbox) → Space Chatterbox multilingue → Gemini TTS → Pollinations → Piper dans le navigateur |
| Images | Votre serveur (Z-Image, Qwen-Image, FLUX.2 klein) → Pollinations (FLUX, Seedream, Qwen-Image) → Space FLUX.1 schnell → Zhipu CogView-3-Flash → SiliconFlow Kolors |
| Retouche par consigne (nuit, home staging…) | Votre serveur (Qwen-Image-Edit-2511) → Space Qwen-Image-Edit |
| Texte → vidéo | Zhipu CogVideoX-Flash → Pollinations (Wan, Seedance…) → Space Wan 2.2 T2V |
| Photo → vidéo | Votre serveur (Wan 2.2) → Space Wan 2.2 I2V → Zhipu CogVideoX-Flash |
| Musique | Votre serveur (ACE-Step 1.5) → Space ACE-Step → Pollinations |
| Détourage, photo 3D, agrandissement, visages | Dans le navigateur (BiRefNet, Depth Anything, Swin2SR, MediaPipe) ou serveur |

Les services en ligne ne sont utilisés qu'après votre accord et ne reçoivent que le texte, l'image ou l'audio traité. Les clés gratuites restent dans votre navigateur. Studios web gratuits (Kling, Hailuo, Vidu, Dreamina, Wan, Qwen Chat, Flow, Luma, Pika) accessibles depuis l'appli. Détails, quotas et licences : [MODELS.md](MODELS.md). Serveur : [server/README.md](server/README.md).

## Astuces et pièges à éviter

Guide intégré (menu ⋯ › Astuces) et [ASTUCES.md](ASTUCES.md) : accroche et rythme, zones masquées, droits musicaux, obligations des annonces immobilières (DPE, honoraires), mentions IA, droit à l'image, drone, publication. « Vérifier ma vidéo » contrôle ces points automatiquement.

## Développement

```bash
python3 build.py                     # assemble index.html, manifest, service worker et icônes depuis src/
npm i --no-save playwright && npx playwright install chromium && node tests/smoke.mjs
```

Charte graphique : [brand/](brand/README.md) · Sécurité : [SECURITY.md](SECURITY.md) · Audit : [AUDIT.md](AUDIT.md)

## Licence

[MIT](LICENSE). Les modèles d'IA et services en ligne gardent leurs propres conditions (voir [MODELS.md](MODELS.md)).
