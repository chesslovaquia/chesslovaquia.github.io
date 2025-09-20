// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';

import { screenLoad   } from './screen';
import { screenResize } from './screen';
import { screenDelay  } from './screen';

import { GameError   } from './GameError';
import { ChessGame   } from './ChessGame';
import { newGameDeps } from './GameDeps';

export function gameInit(): void {
	const loaded = screenLoad(screenDelay);
	if (loaded) {
		console.debug('Screen loaded.');
	} else {
		const boardUI = document.getElementById('chessboard');
		if (boardUI) {
			window.addEventListener('resize', () => screenResize(screenDelay));
			try {
				console.debug('game init board:', boardUI.id);
				const game = new ChessGame(newGameDeps(boardUI));
				game.init();
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
