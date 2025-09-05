// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';

import { screenDelay  } from './screen';
import { screenLoad   } from './screen';
import { screenResize } from './screen';

import { ChessGame  } from './ChessGame';
import { GameConfig } from './GameConfig';
import { GameError  } from './GameError';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const loaded = screenLoad();
	if (loaded) {
		console.debug('Screen loaded.');
	} else {
		window.addEventListener('resize', () => screenResize(screenDelay));
		try {
			const board = document.getElementById('chessboard');
			if (board) {
				const cfg = new GameConfig(board);
				new ChessGame(cfg);
			} else {
				throw new GameError('Chess board not found!');
			}
		} catch (error) {
			clvqInternalError(error);
			throw error;
		}
	}
});
