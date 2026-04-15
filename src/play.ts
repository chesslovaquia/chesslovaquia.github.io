// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import './app.css';
import Play from './Play.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app root not found');

const app = new Play({ target });

export default app;
