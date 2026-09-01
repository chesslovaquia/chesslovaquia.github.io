// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import './app.css';
import App from './App.svelte';
import { ensureOtbAccounts, init } from './lib/accounts';
import { logger } from './lib/logger';
import { initViewportHeight } from './lib/viewport';

initViewportHeight();

const target = document.getElementById('app');
if (!target) throw new Error('#app root not found');

const app = new App({ target });

ensureOtbAccounts()
  .then(() => init())
  .catch((err: unknown) => logger.error('startup error', err));

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { type: 'module' }).catch(() => {
      // registration failures are non-fatal
    });
  });
}

export default app;
