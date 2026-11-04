// ARISE service worker: lets the app open offline once it has been visited.
const CACHE = 'arise-react-player-system-v9-sound';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo-arise.jpg', './alert.mp3', './quest.mp3'];

async function cacheAppShell() {
  const cache = await caches.open(CACHE);
  await cache.addAll(FILES);
  // Vite hashes the bundle names, so read the built index and cache its JS/CSS as well.
  const indexUrl = new URL('./index.html', self.registration.scope);
  const response = await fetch(indexUrl, { cache: 'no-store' });
  if (!response.ok) return;
  const html = await response.text();
  const assets = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/gi)]
    .map((m) => new URL(m[1], self.registration.scope).href);
  if (assets.length) await cache.addAll([...new Set(assets)]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // drop every older cache (including the ones from the iframe-based versions)
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // pages: network first (so new deployments show up), cache as the offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // everything else: cache first
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
    return res;
  }).catch(() => new Response('', { status: 504, statusText: 'Offline' }))));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => (list[0] ? list[0].focus() : self.clients.openWindow('./'))));
});
