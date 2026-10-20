/* Top Clap — service worker : l'appli s'ouvre hors ligne ; les bibliothèques épinglées et les polices sont gardées en cache.
   La version change automatiquement à chaque construction (build.py). Les modèles IA sont mis en cache par Transformers.js lui-même. */
const VERSION = 'tc-__VERSION__';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icone-192.png', './icons/icone-512.png', './icons/logo-icon.svg'];
const IMMUTABLE = /cdn\.jsdelivr\.net\/npm\/[^/]+@\d|fonts\.(googleapis|gstatic)\.com/;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (IMMUTABLE.test(req.url)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; })));
    return;
  }
  if (url.origin !== self.location.origin) return;            // APIs IA, Hugging Face : jamais interceptées
  if (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
