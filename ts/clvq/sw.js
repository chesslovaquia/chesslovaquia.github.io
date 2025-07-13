// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqServiceWorker } from './ClvqServiceWorker.js';

const CACHE_NAME = 'clvq{{ getenv "HUGO_CLVQ_BUILD" | default "UNSET" }}';

const CACHE_URLS = [
	'/',
{{- with index site.Menus "main" }}
	{{- range . }}
	'{{ .URL }}',
	{{- end }}
{{- end }}
];

const SW = ClvqServiceWorker(self, CACHE_NAME);
console.log('Service Worker, CACHE_NAME:', CACHE_NAME);

// Install event - cache resources
self.addEventListener('install', event => {
	console.log('Service Worker Install.');
	event.waitUntil(SW.installHandler(CACHE_URLS));
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
	console.log('Service Worker Activate.');
	event.waitUntil(SW.activateHandler());
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
	event.respondWith(SW.fetchHandler(event.request));
});
