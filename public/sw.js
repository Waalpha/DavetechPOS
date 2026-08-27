/**
 * Davetech POS - Service Worker
 * Comprehensive Offline Caching & Background Resilience Engine
 * Version: 1.0.0
 */

const CACHE_VERSION = 'davetech-pos-v1';
const ASSET_CACHE_NAME = `${CACHE_VERSION}-assets`;
const DATA_CACHE_NAME = `${CACHE_VERSION}-data`;

// Core static assets to precache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// 1. Install Event: Pre-cache core shell assets & take immediate control
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSET_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error (non-fatal):', err);
      });
    }).then(() => {
      // Force activation without waiting
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Clean up outdated caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('davetech-pos-') && name !== ASSET_CACHE_NAME && name !== DATA_CACHE_NAME)
          .map((oldName) => {
            console.log('[SW] Purging outdated cache:', oldName);
            return caches.delete(oldName);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Helper: Determine if request is a core data API request
function isDataRequest(url) {
  return url.pathname.startsWith('/api/') || url.pathname.includes('pos-core-data');
}

// Helper: Determine if request is an asset (JS, CSS, images, fonts, audio)
function isAssetRequest(url) {
  const exts = ['.js', '.jsx', '.ts', '.tsx', '.css', '.woff', '.woff2', '.ttf', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.ico', '.mp3', '.wav'];
  return exts.some((ext) => url.pathname.endsWith(ext)) || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com');
}

// 3. Fetch Event: Multi-tiered caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST, PUT, DELETE) - these are handled by offline sync queue
  if (request.method !== 'GET') {
    return;
  }

  // Strategy A: Core POS Data Request -> Network First, Fallback to Data Cache
  if (isDataRequest(url)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback from Data Cache
          const cachedData = await caches.match(request);
          if (cachedData) {
            return cachedData;
          }
          // If synthetic pos-core-data requested
          const fallbackData = await caches.match('/api/pos-core-data');
          if (fallbackData) {
            return fallbackData;
          }
          return new Response(JSON.stringify({ offline: true, error: 'Offline cached data not available' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // Strategy B: Static Assets & Bundles -> Stale-While-Revalidate or Cache-First
  if (isAssetRequest(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(ASSET_CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failure is expected when offline
            return null;
          });

        // Return cached version immediately if present, otherwise await network
        return cachedResponse || fetchPromise.then((res) => res || cachedResponse);
      })
    );
    return;
  }

  // Strategy C: HTML Navigation requests (SPA page load) -> Network First with App Shell Cache Fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(ASSET_CACHE_NAME).then((cache) => cache.put('/', copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedPage = await caches.match('/') || await caches.match('/index.html');
          if (cachedPage) {
            return cachedPage;
          }
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Davetech POS - Offline Mode</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
                .card { background: #1e293b; padding: 32px; border-radius: 20px; border: 1px solid #334155; max-width: 420px; }
                h1 { margin: 0 0 12px; font-size: 22px; color: #38bdf8; }
                p { margin: 0 0 20px; color: #94a3b8; font-size: 14px; line-height: 1.5; }
                button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>⚡ Davetech POS is Offline Ready</h1>
                <p>You are currently offline. Please reload to launch the cached touch-screen POS interface.</p>
                <button onclick="window.location.reload()">Reload Application</button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Strategy D: Default Fallback -> Network with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(ASSET_CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// 4. Message Listener: Client communication for syncing core data & state
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data) return;

  // Store core POS catalog/data into Cache Storage
  if (data.type === 'CACHE_CORE_DATA') {
    const payload = data.payload;
    const jsonResponse = new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Timestamp': new Date().toISOString(),
      },
    });

    caches.open(DATA_CACHE_NAME).then((cache) => {
      return Promise.all([
        cache.put('/api/pos-core-data', jsonResponse.clone()),
        cache.put('/api/products', new Response(JSON.stringify(payload.products || []), {
          headers: { 'Content-Type': 'application/json' },
        })),
        cache.put('/api/businesses', new Response(JSON.stringify(payload.businesses || []), {
          headers: { 'Content-Type': 'application/json' },
        })),
        cache.put('/api/tables', new Response(JSON.stringify(payload.tables || []), {
          headers: { 'Content-Type': 'application/json' },
        })),
      ]);
    }).then(() => {
      // Notify back client that cache is updated
      event.source?.postMessage({
        type: 'CORE_DATA_CACHED_SUCCESS',
        timestamp: Date.now(),
      });
    }).catch((err) => {
      console.error('[SW] Failed to cache core data:', err);
    });
  }

  // Immediate skip waiting trigger
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
