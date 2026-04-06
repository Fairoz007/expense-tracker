const CACHE_NAME = 'expense-tracker-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
];

// Install Event - Cache initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests
  if (request.method !== 'GET') return;

  // 2. Skip cross-origin requests unless they are for assets we want to cache (like fonts)
  if (!url.origin.includes(self.origin) && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // 3. Skip API calls and dynamic auth routes
  if (
    url.pathname.startsWith('/api/') || 
    url.hostname.includes('convex.cloud') || 
    url.hostname.includes('clerk') ||
    url.hostname.includes('vercel-analytics')
  ) {
    return;
  }

  // 4. Stale-While-Revalidate Strategy for most assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          // If valid response, clone it and put in cache
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
            // Silently fail network fetch if offline
        });

        // Return cached response immediately if it exists, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Push Event - Handle incoming notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Expense Reminder';
  const options = {
    body: data.body || "Don't forget to track your expenses today!",
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [200, 100, 200],
    data: {
        url: '/'
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
