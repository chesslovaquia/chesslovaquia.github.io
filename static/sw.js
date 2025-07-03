const CACHE_NAME = 'v1';
const CACHE_URLS = [
	'/',
	'/game/',
	'/about/'
];
const FALLBACK_URL = '/';

// Install event - cache resources
self.addEventListener('install', event => {
	console.log('Service Worker Install.');
	event.waitUntil(installHandler());
});

async function installHandler() {
	try {
		const cache = await caches.open(CACHE_NAME);
		await cache.addAll(CACHE_URLS);
		console.log('All resources cached successfully.');
		// Force the waiting service worker to become the active service worker
		self.skipWaiting();
	} catch (error) {
		console.error('Cache installation failed:', error);
		throw error;
	}
}

// Activate event - clean up old caches
self.addEventListener('activate', event => {
	console.log('Service Worker Activate.');
	event.waitUntil(activateHandler());
});

async function activateHandler() {
	try {
		const cacheNames = await caches.keys();
		const deletePromises = cacheNames
			.filter(name => name !== CACHE_NAME)
			.map(name => caches.delete(name));

		await Promise.all(deletePromises);
		console.log('Old caches cleaned up.');

		// Take control of all clients immediately
		self.clients.claim();
	} catch (error) {
		console.error('Cache cleanup failed:', error);
	}
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
	event.respondWith(fetchHandler(event.request));
});

async function fetchHandler(request) {
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
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, networkResponse.clone());
		}

		return networkResponse;

	} catch (error) {
		console.error('Fetch failed:', error);

		// Return a fallback response for navigation requests
		if (request.mode === 'navigate') {
			const fallbackResponse = await caches.match(FALLBACK_URL);
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
