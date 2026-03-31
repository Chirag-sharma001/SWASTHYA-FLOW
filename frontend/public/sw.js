const CACHE_NAME = 'swasthya-flow-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  // Usually vite assets would be managed by workbox or injected here, 
  // but for simplicity we rely on the browser's HTTP cache for /assets/*
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API Calls
  if (url.pathname.startsWith('/api/')) {
    
    // GET /api/queue/:id -> Network-first with Custom fallback strategy is handled closely in useOfflineSync.js
    // but the SW can also intercept it:
    if (event.request.method === 'GET' && url.pathname.startsWith('/api/queue/')) {
      event.respondWith(
        fetch(event.request).catch(() => {
          // Dexie is handling fallback on the client side, so we can just return a synthetic 503
          // and the client will use IndexedDB
          return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      return;
    }
    
    // POST /api/tokens -> synthetic 202 if offline
    if (event.request.method === 'POST' && url.pathname === '/api/tokens') {
      event.respondWith(
        fetch(event.request).catch(() => {
          return new Response(JSON.stringify({ message: 'Request accepted for offline sync', offline: true }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      return;
    }
  }

  // Static Assets -> Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok && event.request.method === 'GET' && !url.pathname.startsWith('/api/')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise || new Response('Offline', { status: 503 });
    })
  );
});
