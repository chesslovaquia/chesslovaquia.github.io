// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import './app.css';
import History from './History.svelte';
import { initViewportHeight } from './lib/viewport';

initViewportHeight();

const target = document.getElementById('app');
if (!target) throw new Error('#app root not found');

const app = new History({ target });

export default app;
