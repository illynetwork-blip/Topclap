# Crépuscule Studio

Éditeur vidéo **100 % open source** qui tourne dans le navigateur, inspiré de CapCut et pensé pour les **vidéos immobilières** : timeline multipiste, textes animés, 24 transitions, effets, filtres et effets « Immo IA » (Jour → Nuit, ciel bleu, fenêtres allumées, avant/après…).

Un seul fichier `index.html`, aucune dépendance à installer, aucun serveur : vos photos et vidéos ne quittent jamais votre appareil.

Fonctionne sur **ordinateur, tablette et téléphone** (interface adaptative).

---

## Démarrage rapide

```bash
git clone https://github.com/<votre-compte>/crepuscule-studio.git
cd crepuscule-studio
# ouvrez simplement index.html dans Chrome, Edge, Firefox ou Safari
# ou servez-le en local :
python3 -m http.server 8080   # puis http://localhost:8080
```

### Mise en ligne gratuite avec GitHub Pages

1. Poussez ce dépôt sur GitHub.
2. *Settings › Pages › Build and deployment › Source* : choisissez **GitHub Actions**.
3. Le workflow `.github/workflows/pages.yml` publie l'appli à chaque `push` sur `main`.
4. L'appli est disponible sur `https://<votre-compte>.github.io/crepuscule-studio/`.

---

## Fonctionnalités

### Montage
- Timeline multipiste : vidéo principale (magnétique), incrustations, textes, audio. Ajout / masquage / suppression de pistes.
- Glisser-déposer des fichiers, déplacement des clips entre pistes, rognage par les bords, aimantation sur les bords et la tête de lecture.
- Couper (`S`), dupliquer (`Ctrl+D`), supprimer, annuler / rétablir illimités (`Ctrl+Z` / `Ctrl+Maj+Z`).
- Vitesse 0,25× à 4×, volume, fondus audio, opacité, modes de fusion, position / échelle / rotation directement dans l'aperçu (poignées).
- Formats 16:9 (YouTube), 9:16 (Reels / TikTok / Shorts), 1:1 et 4:5, avec cadrage « Adapter + fond flou » pour passer de l'horizontal au vertical.
- **Montage automatique** : assemble vos médias en annonce avec mouvements de caméra, transitions, prix, caractéristiques et musique.
- Sauvegarde automatique (localStorage + IndexedDB pour les médias), export / import du projet en `.json`.

### Textes
- 40 polices Google Fonts (serif de luxe, scripts, condensées, display…).
- Contour, ombre / néon, fond arrondi, interligne, espacement, lignes secondaires plus petites.
- 12 animations d'entrée (lettre par lettre, machine à écrire, pop, flou, révélation…) et 7 de sortie.
- 12 modèles immobiliers : titre élégant, prix, adresse, caractéristiques, surface, « Nouveauté », visite virtuelle, coup de cœur, exclusivité, portes ouvertes, contact, sous-titre.
- Import de sous-titres `.srt`.

### Transitions (24)
Fondu enchaîné, fondu au noir / blanc, ouverture portes, rideau, glisser, pousser, volets, zoom avant / arrière, plongée drone, cercle, losange, stores, flou, whip pan, rotation, glitch, brûlure film, flash.

### Effets (22)
- **Caméra** : Ken Burns avant / arrière, panoramiques, travelling vertical, drone push-in, orbite, zoom au tempo, caméra épaule.
- **Lumière** : flash d'entrée, light leaks, bokeh doré, vignette, bandes cinéma.
- **Stylisés** : grain film, VHS, glitch, décalage RGB, flou, miroir.
- **Météo** : neige, pluie.

### Filtres (14)
Immo Clean, Lumineux, Luxe chaud, Cinéma (teal & orange), Heure dorée, HDR vif, Nordique, Heure bleue, Mat, Pastel, Vintage, Noir & blanc, Sépia — avec intensité et réglages fins (luminosité, contraste, saturation, température, teinte, couleur, vignette, grain, fondu mat).

### Immo IA (traitement local WebGL)
| Effet | Ce qu'il fait |
|---|---|
| Jour → Nuit | Ciel crépusculaire, façade bleutée, fenêtres et piscine éclairées |
| Coucher de soleil animé | Passage progressif jour → nuit pendant le clip |
| Ciel bleu parfait | Remplace un ciel terne par un ciel bleu nuageux |
| Golden hour | Lumière chaude de fin de journée |
| HDR immobilier | Détails dans les ombres et hautes lumières |
| Fenêtres allumées | Lueur chaleureuse derrière les vitres |
| Avant / Après | Volet fixe ou animé original / retouché |
| Hiver enneigé | Ambiance froide + flocons |
| Drone cinématique | Approche aérienne, bandes cinéma, étalonnage |
| Heure bleue | Ciel profond juste après le coucher du soleil |

La détection du ciel et des fenêtres est algorithmique (couleur, luminance, position, ligne d'horizon réglable). Elle donne de très bons résultats sur les photos d'extérieur classiques ; baissez la *ligne d'horizon* dans **Réglages › Immo IA** si une façade claire est prise pour du ciel.

### Audio
Import de musiques, deux pistes libres de droits générées par l'appli, enregistrement de voix off (micro), forme d'onde dans la timeline.

### Export
- Vidéo **MP4 (H.264)** ou **WebM** selon le navigateur, 720p / 1080p / 1440p, 24 / 30 / 60 i/s.
- Image PNG de l'instant, projet `.json`.
- L'export se fait en temps réel : gardez l'onglet au premier plan.

---

## Aller plus loin avec de vrais modèles génératifs

Les effets « Immo IA » fonctionnent sans serveur. Pour de la génération par IA (ex. transformer une vidéo de jour en vraie vidéo de nuit, mobilier virtuel, ciel réaliste), voici des briques **open source** à brancher :

- **Segmentation du ciel / des fenêtres** : Segment Anything (Meta) ou des modèles de segmentation sémantique exécutés dans le navigateur avec ONNX Runtime Web ou Transformers.js.
- **Jour → nuit photoréaliste, home staging virtuel** : Stable Diffusion (img2img + ControlNet) via ComfyUI ou `diffusers`, à exposer derrière une petite API.
- **Profondeur / effet parallaxe 2,5D** : Depth Anything ou MiDaS.
- **Sous-titres automatiques** : Whisper (whisper.cpp, ou Transformers.js côté navigateur).
- **Amélioration de netteté** : Real-ESRGAN.

Le moteur de rendu est isolé dans les fonctions `clipParams()` (paramètres), `GLX.run()` (shader WebGL) et `renderClip()` (composition) : un traitement IA peut y produire une image ou une texture qui remplace la source.

---

## Architecture

```
index.html
├── CSS        thème « crépuscule », grille responsive (bureau / tablette / téléphone)
├── Catalogues FONTS, FILTERS, FX, TRANS, TEXT_TPL, SHAPES, IMMO
├── Scènes     makeScene() : 3 scènes immobilières de démonstration dessinées en Canvas
├── GLX        shader WebGL : étalonnage, Jour → Nuit, ciel, fenêtres, HDR, VHS, flou…
├── Rendu      renderFrame() → renderClip() (Canvas 2D) → compose() pour les transitions
├── Timeline   renderTimeline(), glisser / rogner / aimanter, piste magnétique
├── Panneaux   renderPanel() (onglets) et renderInspector() (réglages du clip)
└── Export     MediaRecorder (canvas.captureStream + Web Audio)
```

Navigateurs recommandés : Chrome / Edge récents (export MP4). Firefox et Safari sont pris en charge ; le format d'export dépend de leur `MediaRecorder`.

## Contribuer

Les contributions sont bienvenues : nouvelles transitions (ajoutez un `case` dans `compose()` et une entrée dans `TRANS`), nouveaux effets (`FX` + `fxMotion()` / `fxOverlay()` / `clipParams()`), nouveaux modèles de texte (`TEXT_TPL`).

## Licence

[MIT](LICENSE) — libre d'utilisation, de modification et de redistribution, y compris commerciale.
