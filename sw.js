/* Service Worker — instala la app y la deja usable sin conexión.
   Shell: cache-first. data.json: network-first (siempre intenta lo
   más nuevo; si no hay red, sirve la última copia cacheada). */
const CACHE = 'kia-leads-v1';
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
  const esDatos = req.url.includes('data.json');
  if (esDatos) {
    // network-first para los datos
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('data.json', copy)).catch(() => {}); return res; })
        .catch(() => caches.match('data.json'))
    );
  } else {
    // cache-first para el shell
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); return res; }).catch(() => caches.match('index.html')))
    );
  }
});
