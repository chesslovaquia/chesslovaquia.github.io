// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { screenDelay  } from './screen';
import { screenLoad   } from './screen';
import { screenResize } from './screen';

import { ChessGame  } from './ChessGame';
import { GameConfig } from './GameConfig';
import { GameError  } from './GameError';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	window.addEventListener('resize', () => screenResize(screenDelay));
	screenLoad().then(() => {
		const board = document.getElementById('chessboard');
		if (board) {
			const cfg = new GameConfig(board);
			new ChessGame(cfg);
		} else {
			throw new GameError('Chess board not found!');
		}
	});
});
