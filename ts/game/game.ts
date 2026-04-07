// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';
import { logger            } from '../clvq/Logger';
import { ElementIds        } from '../clvq/ElementIds';
import { ClvqLocalStorage  } from '../clvq/ClvqLocalStorage';

import { GameError   } from './GameError';
import { ChessGame   } from './ChessGame';
import { newGameDeps } from './GameDeps';

import { LichessAuth      } from '../lichess/LichessAuth';
import { LichessClient    } from '../lichess/LichessClient';
import { LichessStream    } from '../lichess/LichessStream';
import { LichessGame      } from '../lichess/LichessGame';
import { LichessGameState } from '../lichess/LichessGameState';

const LICHESS_GAME_ID_KEY = 'lichess_game_id';

export function gameInit(): void {
	const boardUI = document.getElementById(ElementIds.chessboard);
	if (boardUI) {
		try {
			logger.debug('game init board:', boardUI.id);
			const ls = new ClvqLocalStorage();
			const gameId = ls.getItem(LICHESS_GAME_ID_KEY);
			if (gameId) {
				lichessGameInit(boardUI, gameId, ls).catch((error) => {
					clvqInternalError(error as Error);
				});
				return;
			}
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

async function lichessGameInit(boardUI: HTMLElement, gameId: string, ls: ClvqLocalStorage): Promise<void> {
	const auth = new LichessAuth(ls);
	const user = auth.getUser();
	if (!user) {
		logger.warn('lichess game init: no logged-in user, clearing game ID');
		ls.removeItem(LICHESS_GAME_ID_KEY);
		const game = new ChessGame(newGameDeps(boardUI));
		game.init();
		return;
	}

	const client      = new LichessClient(auth);
	const stream      = new LichessStream(client);
	const lichessGame = new LichessGame(client, stream);

	const deps         = newGameDeps(boardUI);
	const lichessState = new LichessGameState(
		lichessGame, deps.engine, deps.clock, deps.nav,
		gameId, user.id,
	);
	deps.state   = lichessState;
	deps.onMove  = (uci: string) => lichessGame.makeMove(gameId, uci);

	try {
		await lichessState.load();
	} catch (error) {
		logger.error('lichess game stream error, clearing game ID:', error);
		ls.removeItem(LICHESS_GAME_ID_KEY);
		throw error;
	}

	deps.playerColor = lichessState.getPlayerColor();

	// Clear persisted game ID when the game finishes.
	lichessGame.onGameFinish((_finishedId: string) => {
		ls.removeItem(LICHESS_GAME_ID_KEY);
	});
	// Run event stream on game page so gameFinish events are received.
	lichessGame.startEventStream();

	const game = new ChessGame(deps);
	game.init();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => { gameInit() });
