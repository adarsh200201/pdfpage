// Service Worker for PDFPage - Performance Optimization
const CACHE_NAME = 'pdfpage-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/img',
  '/favicon',
  '/offline.html',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then(cache => {
              return cache.match(OFFLINE_PAGE);
            });
        })
    );
    return;
  }

  // Handle asset requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }

        // Fetch from network and cache the response
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache static assets and API responses
            if (shouldCache(event.request.url)) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // If it's an image request, return a placeholder
            if (event.request.destination === 'image') {
              return new Response(
                '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Image not available</text></svg>',
                {
                  headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'no-cache'
                  }
                }
              );
            }
            
            // For other requests, just fail
            throw error;
          });
      })
  );
});

// Helper function to determine if a URL should be cached
function shouldCache(url) {
  // Cache static assets
  if (url.includes('/static/') || 
      url.includes('/assets/') || 
      url.includes('/images/') ||
      url.endsWith('.js') ||
      url.endsWith('.css') ||
      url.endsWith('.woff2') ||
      url.endsWith('.png') ||
      url.endsWith('.jpg') ||
      url.endsWith('.svg') ||
      url.endsWith('.ico')) {
    return true;
  }

  // Cache API responses for tool metadata
  if (url.includes('/api/tools') || url.includes('/api/health')) {
    return true;
  }

  return false;
}

// Handle background sync for analytics
self.addEventListener('sync', event => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Background sync function
async function syncAnalytics() {
  try {
    // Send any queued analytics data when back online
    const queuedData = await getQueuedAnalyticsData();
    if (queuedData.length > 0) {
      await sendAnalyticsData(queuedData);
      await clearQueuedAnalyticsData();
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for analytics sync
async function getQueuedAnalyticsData() {
  const cache = await caches.open('analytics-queue');
  const requests = await cache.keys();
  return requests.map(req => req.url);
}

async function sendAnalyticsData(data) {
  // Implementation depends on your analytics service
  console.log('Sending queued analytics data:', data);
}

async function clearQueuedAnalyticsData() {
  const cache = await caches.open('analytics-queue');
  await cache.clear();
}

// Handle push notifications (for future enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'pdfpage-notification'
    };

    event.waitUntil(
      self.registration.showNotification('PDFPage', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
