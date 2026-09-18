const CACHE_NAME = 'taqeem-v2.0-rev4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/demo.html',
  '/vote.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/lib/qrcode.js',
  '/lib/supabase.js',
  '/lib/confetti.js',
  '/winners/index.html',
  '/winners/style.css',
  '/winners/app.js',
  '/icons/logo.png',
  '/icons/icon-192.png',
  '/audio/drumroll.mp3',
  '/audio/cheer.mp3',
  '/audio/idle.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url =>
            fetch(url)
              .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
                return cache.put(url, res);
              })
              .catch(err => console.warn(`Asset cache skipped: ${url}`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Network First strategy
self.addEventListener('fetch', event => {
  // Only handle GET requests and HTTP/HTTPS schemes
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Valid responses are cloned and cached
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache).catch(err => {
                console.warn('Cache put failed:', err);
              });
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/demo.html') || caches.match('/index.html');
            }
            return null;
          });
      })
  );
});
