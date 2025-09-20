// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';

import { screenLoad   } from './screen';
import { screenResize } from './screen';
import { screenDelay  } from './screen';

import { ChessGame  } from './ChessGame';
import { GameConfig } from './GameConfig';
import { GameError  } from './GameError';

export function gameInit(): void {
	const loaded = screenLoad(screenDelay);
	if (loaded) {
		console.debug('Screen loaded.');
	} else {
		const board = document.getElementById('chessboard');
		if (board) {
			window.addEventListener('resize', () => screenResize(screenDelay));
			try {
				console.debug('game init board:', board);
				const cfg = new GameConfig(board);
				new ChessGame(cfg);
			} catch (error) {
				clvqInternalError(error as Error);
				throw error;
			}
		} else {
			console.error('game init board not found!');
			throw new GameError('Chess board not found!');
		}
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => { gameInit() });
