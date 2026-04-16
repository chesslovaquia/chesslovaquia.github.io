// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

/// <reference lib="webworker" />

// Service worker — network-first with stale fallback.
// Cache name is versioned so activate purges old caches on update.

declare const __APP_VERSION__: string;

const CACHE = `clvq-v${__APP_VERSION__}`;
const SHELL = ['/', '/manifest.json', '/favicon.ico', '/clvq-192.png', '/clvq-512.png'];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL))
  );
  (self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  (self as unknown as ServiceWorkerGlobalScope).clients.claim();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== (self as unknown as ServiceWorkerGlobalScope).location.origin) return;

  event.respondWith(
    (async () => {
      const networkPromise = fetch(req)
        .then(async (res) => {
          if (res && res.ok) {
            const cache = await caches.open(CACHE);
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch((): null => null);

      const net = await networkPromise;
      if (net) return net;

      const cached = await caches.match(req);
      if (cached) return cached;

      if (req.mode === 'navigate') {
        const fallback = await caches.match('/');
        if (fallback) return fallback;
      }
      return new Response('', { status: 504, statusText: 'Offline' });
    })()
  );
});
