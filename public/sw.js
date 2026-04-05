// Service Worker for PDFPage - Cache-first for assets, Network-first for HTML
const CACHE_VERSION = 'v1';
const CACHE_NAME = `pdfpage-${CACHE_VERSION}`;
const ASSETS_CACHE = `pdfpage-assets-${CACHE_VERSION}`;

// Files to cache on install
const PRECACHE_URLS = [
  '/',
];

// Install event - cache only critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) => {
      console.log('[SW] Caching critical assets');
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.log('[SW] Precache failed (non-critical):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network-first for HTML, Cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network-first for HTML (always check server first)
  if (request.headers.get('accept')?.includes('text/html') || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful HTML responses
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline - Page not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          });
        })
    );
    return;
  }

  // Cache-first for assets (JS, CSS, images, fonts, etc.)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseToCache = response.clone();
              caches.open(ASSETS_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
          })
          .catch(() => {
            // Silent fail for background updates
          });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((response) => {
          // Cache successful responses for assets
          if (response.ok) {
            const responseToCache = response.clone();
            const cacheName = request.url.includes('/assets/') ? ASSETS_CACHE : CACHE_NAME;
            caches.open(cacheName).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline response for failed asset requests
          return new Response('Offline - Asset not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      ).then(() => {
        console.log('[SW] All caches cleared');
      });
    });
  }
});

console.log('[SW] Service worker loaded and ready');
