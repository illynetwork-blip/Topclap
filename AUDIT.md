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

---

# Audit — version 3 (20 octobre 2026)

## Ajouts vérifiés

- **Moteurs IA automatiques** : 8 tâches (rédaction, sous-titres, voix off, images, retouche, texte → vidéo, photo → vidéo, musique), 34 moteurs : serveur personnel, Groq, Zhipu GLM, Gemini, OpenRouter, SiliconFlow, Pollinations, Spaces Hugging Face, modèles du navigateur. Repli automatique en cas d'échec. Test : sans réseau, chaque tâche échoue proprement et la rédaction revient au texte modèle.
- **Écran Démarrer + installation** (comme Toc-Toc) : manifest, service worker versionné, icônes, bouton « Installer l'appli », bibliothèque de projets.
- **Vision IA sur l'appareil** (MediaPipe 1.0.1) : arrière-plan, floutage des visages, recadrage automatique. Test : sans réseau, aucun plantage et un seul message d'erreur.
- **Enregistreur caméra / écran avec prompteur**, émojis, guide « Astuces et pièges », contrôles DPE F/G et mentions IA.
- 17 scénarios automatiques au vert ; aucun débordement sur téléphone, tablette, ordinateur.

## Corrections

| Problème | Correction |
|---|---|
| Pollinations exige désormais une clé (nouvelle API `gen.pollinations.ai`) | Moteur mis à jour, présenté comme « compte gratuit » et non plus « sans clé » |
| Option `hf_token` ignorée par le client Gradio 2.x | Remplacée par `token` |
| Space Gradio appelé avec une route fixe `/generate` | Adaptateur générique : lecture de l'API du Space, choix de la route et remplissage des entrées par type |
| Modèles Gemini et OpenRouter codés en dur (risque d'obsolescence) | Choix automatique à partir de la liste des modèles du compte |
| Erreurs de moteur peu explicites | Message par moteur, puis message final si tous échouent ou si aucun n'est configuré |
| `connect-src` sans `wss:` (certains Spaces Gradio) | Ajouté à la politique de sécurité |
| Écran Démarrer : carte orpheline sur téléphone et tablette | Grille équilibrée |

## Non testé dans cet environnement (réseau sortant bloqué)

Les appels réels à Groq, Zhipu, SiliconFlow, Gemini, OpenRouter, Pollinations, aux Spaces Hugging Face et le téléchargement des modèles MediaPipe n'ont pas pu être exécutés ici. Les formats de requête suivent la documentation publique de chaque service (octobre 2026) ; certaines API peuvent refuser les appels directs depuis un navigateur (CORS) : le repli automatique passe alors au moteur suivant. À valider depuis l'appli en ligne, avec vos clés.
