const CACHE_NAME = 'wkf-exam-v7';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.png',
  '/favicon-dark.png',
  '/favicon-light.png',
  '/wkf-logo.svg',
  '/wkf-logo-dark.svg',
  '/wkf-logo-light.svg',
  '/wkf-logo.png',
  '/wkf-logo-dark.png',
  '/wkf-logo-light.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-dark-192x192.png',
  '/pwa-dark-512x512.png',
  '/pwa-light-192x192.png',
  '/pwa-light-512x512.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-dark.png',
  '/apple-touch-icon-light.png',
  '/data/kumite.json',
  '/data/kata.json',
  '/data.json',
  '/images/rules/kumite-tatami-area.png',
  '/images/rules/kumite-competition-setups.png',
  '/images/rules/kumite-uniform-layout.png',
  '/images/rules/kumite-video-review-cards.png',
  '/images/rules/kumite-signals-start-stop.png',
  '/images/rules/kumite-signals-scores-cancellations.png',
  '/images/rules/kumite-signals-penalties-warnings.png',
  '/images/rules/kumite-signals-decisions.png',
  '/images/rules/kumite-signals-video-review-flags.png',
  '/images/rules/kumite-protest-form.png',
  '/images/rules/kumite-two-judge-system.png',
  '/images/rules/kata-tatami-area.png',
  '/images/rules/kata-uniform-layout.png',
  '/images/rules/kata-belts-layout.png',
  '/images/rules/kata-scoreboard.png',
  '/images/rules/kata-official-list.png',
  '/images/rules/kata-protest-form.png',
  '/images/rules/para-tatami-area.png',
  '/images/rules/para-uniform-layout.png',
  '/images/rules/para-wheelchair-strapping.png',
  '/images/rules/para-wheelchair-specs.png'
];

// Install: pre-cache static assets resiliently
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn(`[SW] Precache skipped for ${asset}:`, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// Activate: remove obsolete caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: offline-first strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore non-http(s) requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) return;

  // For data files (kumite.json, kata.json): Network-First with cache fallback
  if (url.pathname.startsWith('/data/') || url.pathname === '/data.json') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other requests (scripts, styles, images): Cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback for html
        if (request.headers.get('accept')?.includes('text/html') || request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
