// Service Worker for PWA support
const CACHE_NAME = 'pdfpage-v1';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((cacheError) => {
        console.log('[SW] Cache add failed:', cacheError);
        // Don't fail installation if caching fails
        return Promise.resolve();
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .catch((activateError) => {
        console.log('[SW] Activate error:', activateError);
      })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests - always go to network
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .catch((fetchError) => {
          console.log('[SW] API fetch failed:', fetchError);
          return new Response('API request failed', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response before caching
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch((cacheError) => {
                console.log('[SW] Error caching response:', cacheError);
              });

            return response;
          })
          .catch((fetchError) => {
            console.log('[SW] Fetch failed:', fetchError);
            // Return offline page or error response
            return new Response('Offline - page not available', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
      })
      .catch((matchError) => {
        console.log('[SW] Cache match error:', matchError);
        return new Response('Error loading page', {
          status: 500,
          statusText: 'Internal Error',
        });
      })
  );
});

// Message event for cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME)
      .then(() => {
        console.log('[SW] Cache cleared');
        event.ports[0].postMessage({ success: true });
      })
      .catch((clearError) => {
        console.log('[SW] Error clearing cache:', clearError);
        event.ports[0].postMessage({ success: false, error: clearError });
      });
  }
});
