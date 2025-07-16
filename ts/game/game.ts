// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessGame }       from './ChessGame';
import { ChessGameConfig } from './ChessGameConfig';
import { ChessGameError }  from './ChessGameError';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const board = document.getElementById('chessboard');
	if (board) {
		const cfg = new ChessGameConfig(board);
		new ChessGame(cfg);
	} else {
		throw new ChessGameError('Chess board not found!');
	}
});
