/* Service Worker — instala la app y la deja usable sin conexión.
   Estrategia network-first para TODO (shell + datos): siempre intenta
   traer lo más nuevo; si no hay red, sirve la última copia cacheada.
   Al subir el número de versión (v2, v3, ...) se purga la caché vieja. */
const CACHE = 'kia-leads-v2';
const SHELL = ['index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // network-first: intenta red, cachea la respuesta y, si falla, usa caché
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      const key = req.url.includes('data.json') ? 'data.json' : req;
      caches.open(CACHE).then(c => c.put(key, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
