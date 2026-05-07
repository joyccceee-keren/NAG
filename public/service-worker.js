// ==================== SERVICE WORKER FOR OFFLINE SUPPORT ====================
const CACHE_NAME = 'doorpilot-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/animations.css',
  '/css/responsive.css',
  '/js/db.js',
  '/js/api.js',
  '/js/map-utils.js',
  '/js/voice-recorder.js',
  '/js/app.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS.filter(url => {
          // Skip external resources in initial cache
          return !url.includes('cdnjs') && !url.includes('socket.io');
        }));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API requests and socket.io
  if (url.pathname.startsWith('/api') || url.pathname.includes('socket.io')) {
    return event.respondWith(
      fetch(request)
        .catch(() => new Response(
          JSON.stringify({ error: 'Offline' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'application/json' })
          }
        ))
    );
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) return response;

        return fetch(request).then((response) => {
          // Clone the response
          const responseClone = response.clone();

          // Cache new responses
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return response;
        });
      })
      .catch(() => {
        // Fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }

        return new Response(
          'Service temporarily unavailable',
          { status: 503, statusText: 'Service Unavailable' }
        );
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync (for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(
      // Sync pending orders when online
      Promise.resolve()
    );
  }
});
