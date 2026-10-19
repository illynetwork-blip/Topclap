# Politique de sécurité

## Signaler une vulnérabilité

Merci de **ne pas ouvrir d'issue publique**. Utilisez *Security › Report a vulnerability* (signalement privé GitHub). Nous répondons sous 7 jours.

## Principes de l'application

- **Aucune donnée envoyée** : l'éditeur fonctionne entièrement dans le navigateur. Les médias restent sur l'appareil (IndexedDB locale). Aucune télémétrie, aucun cookie, aucun compte.
- **Content-Security-Policy** stricte sur les origines : scripts uniquement depuis la page et `cdn.jsdelivr.net` (bibliothèques IA épinglées à une version), polices Google Fonts, pas d'`<object>`, `base-uri` et `form-action` bloqués. `unsafe-eval` est requis par ONNX Runtime (moteur des modèles IA).
- **Dépendances épinglées** : Transformers.js `4.3.0`, Piper TTS web `1.0.5`. Aucune version flottante.
- **Modèles IA** téléchargés depuis Hugging Face uniquement à la demande de l'utilisateur, puis mis en cache par le navigateur.
- Aucun secret dans le dépôt. Le jeton du serveur IA est saisi par l'utilisateur et stocké uniquement dans son navigateur.

## Serveur IA (dossier `server/`)

- À exécuter sur **votre** machine ou réseau privé. Ne l'exposez pas sur Internet sans :
  - `TOPCLAP_TOKEN` défini (authentification `Bearer` sur toutes les routes de traitement),
  - `CORS_ORIGINS` limité à l'adresse de votre éditeur (ex. `https://<compte>.github.io`),
  - un reverse proxy HTTPS (Caddy, Traefik, Nginx).
- Les fichiers reçus sont écrits dans des dossiers temporaires uniques et supprimés après la réponse.
- Les commandes externes (FFmpeg, Demucs) sont appelées sans shell, avec des arguments contrôlés. Seule `ACESTEP_CMD` (définie par l'administrateur) passe par le shell, avec le prompt échappé (`shlex.quote`).

## Automatisation GitHub

- **CodeQL** (JavaScript, Python, Actions) à chaque push et chaque semaine.
- **Dependabot** pour les Actions, les dépendances Python et l'image Docker.
- Workflows avec permissions minimales (`contents: read` par défaut).

Réglages recommandés du dépôt : *Settings › Code security* → activez Secret scanning, Push protection, Dependabot alerts ; *Settings › Branches* → protégez `main` (pull request + vérifications obligatoires).
