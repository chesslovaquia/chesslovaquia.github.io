// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';

import { ChessgroundBoard } from '../board/ChessgroundBoard';

import { ChessjsEngine } from '../engine/ChessjsEngine';

import { screenLoad   } from './screen';
import { screenResize } from './screen';
import { screenDelay  } from './screen';

import { GameError     } from './GameError';
import { ChessGame     } from './ChessGame';
import { GameConfig    } from './GameConfig';
import { GameClock     } from './GameClock';
import { GameNavigate  } from './GameNavigate';
import { GameStateImpl } from './GameState';

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
				const cfg = new GameConfig(boardUI);
				const engine = new ChessjsEngine();
				const board = new ChessgroundBoard(cfg, engine);
				const clock = new GameClock(cfg.ui, engine);
				const nav = new GameNavigate(cfg.ui, board, engine);
				const state = new GameStateImpl(engine, clock, nav);
				const game = new ChessGame({
					cfg: cfg,
					engine: engine,
					board: board,
					clock: clock,
					nav: nav,
					state: state,
				});
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
