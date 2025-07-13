// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class ClvqServiceWorker {
	private readonly sw:        any
	private readonly cacheName: string

	constructor(sw: any, cacheName: string) {
		console.log('ClvqServiceWorker loaded:', sw)
		this.sw        = sw
		this.cacheName = cacheName
	}

	public async installHandler(urls: string[]) {
		try {
			const cache = await caches.open(this.cacheName);
			await cache.addAll(urls);
			console.log('All resources cached successfully.');
			// Force the waiting service worker to become the active service worker
			this.sw.skipWaiting();
		} catch (error) {
			console.error('Cache installation failed:', error);
			throw error;
		}
	}

	public async activateHandler() {
		try {
			const cacheNames = await caches.keys();
			const deletePromises = cacheNames
				.filter(name => name !== this.cacheName)
				.map(name => caches.delete(name));

			await Promise.all(deletePromises);
			console.log('Old caches cleaned up.');

			// Take control of all clients immediately
			this.sw.clients.claim();
		} catch (error) {
			console.error('Cache cleanup failed:', error);
		}
	}

	public async fetchHandler(request: Request) {
		try {
			// Check if request is in cache
			const cachedResponse = await caches.match(request);

			if (cachedResponse) {
				console.log('Cache HIT:', request.url);
				return cachedResponse;
			}

			// If not in cache, fetch from network
			console.log('Cache MISS:', request.url);
			const networkResponse = await fetch(request);

			// Optionally cache successful responses for future use
			if (networkResponse.ok && request.method === 'GET') {
				console.log('Cache PUT:', request.url);
				const cache = await caches.open(this.cacheName);
				cache.put(request, networkResponse.clone());
			}

			return networkResponse;

		} catch (error) {
			console.error('Fetch failed:', error);

			// Return a fallback response for navigation requests
			if (request.mode === 'navigate') {
				const fallbackResponse = await caches.match('/');
				if (fallbackResponse) {
					return fallbackResponse;
				}
			}

			// Return a generic offline page or error response
			return new Response('Offline - Content not available', {
				status: 503,
				statusText: 'Service Unavailable',
				headers: { 'Content-Type': 'text/plain' }
			});
		}
	}
}

export { ClvqServiceWorker }
