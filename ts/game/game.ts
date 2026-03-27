// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';
import { logger            } from '../clvq/Logger';
import { ElementIds        } from '../clvq/ElementIds';

import { GameError   } from './GameError';
import { ChessGame   } from './ChessGame';
import { newGameDeps } from './GameDeps';

export function gameInit(): void {
	const boardUI = document.getElementById(ElementIds.chessboard);
	if (boardUI) {
		try {
			logger.debug('game init board:', boardUI.id);
			const game = new ChessGame(newGameDeps(boardUI));
			game.init();
		} catch (error) {
			clvqInternalError(error as Error);
			throw error;
		}
	} else {
		logger.error('game init board not found!');
		throw new GameError('Chess board not found!');
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => { gameInit() });
