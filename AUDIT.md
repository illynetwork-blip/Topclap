# Audit — version 2.0 (octobre 2026)

## Méthode

- Relecture complète du code de la v1, puis découpage en modules (`src/js/*.js`) assemblés par `build.py`.
- Tests automatisés `tests/smoke.mjs` (Chromium + WebGL logiciel) : 13 scénarios, tous verts. Ils tournent dans la CI GitHub à chaque push.
- Tests manuels sur 3 tailles d'écran (390 px, 1024 px, 1440 px) : aucun débordement horizontal.
- Serveur IA : démarrage, `/health`, conversion MP4 + loudnorm, stabilisation, ralenti, refus propre (503) des fonctions non installées, en-têtes CORS.

## Corrections apportées à la v1

| Problème | Correction |
|---|---|
| Suppression de piste : condition sans effet, risque d'effacer des clips sans prévenir | Confirmation par double clic quand la piste contient des clips |
| Bouton Exporter recevait l'événement comme liste de formats | Appel explicite `openExport()` |
| Fondu au noir : calcul d'opacité incohérent | Simplifié |
| Couper un clip animé perdait les images clés et les sous-titres | Images clés et mots recalés sur chaque moitié |
| Textes et prix sortant du cadre en 9:16 / 1:1 | « Garder dans le cadre » : mise à l'échelle et recentrage automatiques |
| Coupe sur le rythme raccourcissait la vidéo | La durée totale est conservée, plans répartis sur les temps |
| Sous-titres collés (« PROVENCEVA ») | Espacement tenant compte du contour |
| Icône manquante (forme « Barre de progression ») | Ajoutée |
| Chargement IA pouvant rester bloqué sans réseau | Délai maximal de 20 s et message clair |
| Export en onglet masqué : vidéo saccadée sans prévenir | Avertissement à l'utilisateur |
| Champ `.srt` seul | `.srt` et `.vtt`, convertis en sous-titres animés |

## Sécurité

- Content-Security-Policy restrictive sur les origines (voir `SECURITY.md`), `no-referrer`, aucune donnée envoyée, aucune dépendance flottante.
- CodeQL, Dependabot, permissions minimales des workflows.
- Serveur : jeton `Bearer` optionnel, CORS configurable, fichiers temporaires isolés et supprimés, commandes externes sans shell.

## Limites connues (assumées)

- L'export se fait en temps réel (MediaRecorder) : une vidéo de 60 s prend 60 s par format. Le format MP4 dépend du navigateur (Chrome / Edge / Safari : MP4 ; Firefox : WebM, convertible via le serveur).
- Les modèles IA du navigateur demandent un premier téléchargement (50 à 500 Mo) et sont plus lents sans WebGPU.
- Les fonctions « Serveur » (vidéo générée, nuit photoréaliste, home staging, musique…) nécessitent une carte graphique. Les appels au serveur ont été testés jusqu'à la réponse 503 « non installé » ; l'inférence des gros modèles n'a pas pu être exécutée dans l'environnement de développement (pas de GPU) et doit être validée sur votre machine.
- Pas de suivi de mouvement (tracking) ni de stabilisation dans le navigateur (stabilisation disponible sur le serveur).
