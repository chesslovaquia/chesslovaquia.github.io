// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import './app.css';
import Stats from './Stats.svelte';
import { initViewportHeight } from './lib/viewport';

initViewportHeight();

const target = document.getElementById('app');
if (!target) throw new Error('#app root not found');

const app = new Stats({ target });

export default app;
