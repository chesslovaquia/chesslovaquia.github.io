// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import './app.css';
import Settings from './Settings.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app root not found');

const app = new Settings({ target });

export default app;
