// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessGame  } from './ChessGame';
import { GameConfig } from './GameConfig';
import { GameError  } from './GameError';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const board = document.getElementById('chessboard');
	if (board) {
		const cfg = new GameConfig(board);
		new ChessGame(cfg);
	} else {
		throw new GameError('Chess board not found!');
	}
});
