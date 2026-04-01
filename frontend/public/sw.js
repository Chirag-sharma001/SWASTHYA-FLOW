// Bump this version to invalidate all caches on deploy
const CACHE_VERSION = 'v2';
const CACHE_NAME = `swasthya-flow-${CACHE_VERSION}`;

// Shell assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  // Patient check-in shell — cached so it loads with zero internet
  '/patient/join/',
];

// ── Install: pre-cache shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── API: GET /api/queue/* — network-first, fall back to cached response ──
  if (request.method === 'GET' && url.pathname.startsWith('/api/queue/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache the fresh response for offline reads
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response(JSON.stringify({ error: 'Offline', offline: true }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        })
    );
    return;
  }

  // ── API: POST /api/tokens — synthetic 202 when offline ───────────────────
  // Actual queuing is handled by useOfflineSync (Dexie); SW just prevents
  // the fetch from throwing so the hook can detect the 202 and write to IDB.
  if (request.method === 'POST' && url.pathname === '/api/tokens') {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ message: 'Queued for offline sync', offline: true }),
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // ── Static assets (JS, CSS, images, fonts) — stale-while-revalidate ──────
  if (request.method === 'GET' && !url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) {
              caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
            }
            return res;
          })
          .catch(() => null);

        // Return cached immediately; update in background
        return cached || network || new Response('Offline', { status: 503 });
      })
    );
  }
});
