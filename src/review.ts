// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import './app.css';
import '@lichess-org/chessground/assets/chessground.base.css';
import './chessground.wood4.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import './board-wood4.css';
import Review from './Review.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app root not found');

const app = new Review({ target });

export default app;
