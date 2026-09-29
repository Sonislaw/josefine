const CACHE = 'josefine-runtime-v1'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const fetchAndCache = () => fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()))
    return response
  })
  // HTML must be fresh after a deployment; assets can be served from runtime cache offline.
  event.respondWith(event.request.mode === 'navigate'
    ? fetchAndCache().catch(() => caches.match(event.request).then((cached) => cached ?? caches.match('/')))
    : caches.match(event.request).then((cached) => cached ?? fetchAndCache()))
})
