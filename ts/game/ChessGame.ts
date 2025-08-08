// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chessground           } from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';

import * as board from 'chessground/types';
import * as game  from 'chess.js';

import { ChessGameConfig    } from './ChessGameConfig';
import { ChessGameDisplay   } from './ChessGameDisplay';
import { ChessGameError     } from './ChessGameError';
import { ChessGameMove      } from './ChessGameMove';
import { ChessGamePromotion } from './ChessGamePromotion';
import { ChessGameState     } from './ChessGameState';
import { ChessGamePlayer    } from './ChessGamePlayer';
import { ChessGameClock     } from './ChessGameClock';

class ChessGame {
	private readonly game:      game.Chess;
	private readonly board:     ChessgroundApi;
	private readonly move:      ChessGameMove;
	private readonly promotion: ChessGamePromotion;
	private readonly state:     ChessGameState;
	private readonly display:   ChessGameDisplay;
	private readonly clock:     ChessGameClock;

	private readonly p1: ChessGamePlayer;
	private readonly p2: ChessGamePlayer;

	private active: boolean;

	constructor(config: ChessGameConfig) {
		console.debug('Game config:', config);
		this.active    = false;
		this.game      = this.newGame();
		this.p1        = new ChessGamePlayer("1");
		this.p2        = new ChessGamePlayer("2");
		this.clock     = new ChessGameClock(this.game, this.p1, this.p2, 900, 10);
		this.state     = new ChessGameState(this.game, this.clock);
		this.board     = this.newBoard(config);
		this.move      = new ChessGameMove(this.game, this.board);
		this.display   = new ChessGameDisplay(config, this.game, this.move);
		this.promotion = new ChessGamePromotion(this.move, this.display);
		if (this.board) {
			this.setupEventListeners(config);
			this.init();
		}
	}

	private init(): void {
		console.debug('Game init.');
		this.disableBoard();
		this.state.load().then((done) => {
			console.debug('Game load done:', done);
			if (done) {
				this.move.updateBoard(this.move.getLastMove());
				this.display.updateStatus();
				this.start();
			}
		});
		this.enableBoard();
	}

	private setupEventListeners(cfg: ChessGameConfig): void {
		console.debug('Game setup event listeners.');
		cfg.resetButton?.addEventListener('click', () => this.reset());
	}

	private newGame(): game.Chess {
		return new game.Chess(game.DEFAULT_POSITION);
	}

	private newBoard(config: ChessGameConfig): ChessgroundApi {
		if (!config.boardElement) {
			throw new ChessGameError('Init board element not found.');
		}
		return Chessground(config.boardElement, {
			disableContextMenu: true,
			coordinates: false,
			fen: this.game.fen(),
			orientation: 'white',
			turnColor: 'white',
			movable: {
				color: 'white',
				free: false,
				showDests: false,
				rookCastle: true,
				events: {
					after: (orig: board.Key, dest: board.Key, meta?: board.MoveMetadata) => {
						this.afterMove(orig, dest)
					},
				},
			},
			events: {
				move: (orig: board.Key, dest: board.Key, gotPiece?: board.Piece) => {
					this.onMove(orig, dest, gotPiece)
				},
			},
			highlight: {
				lastMove: true,
				check: true,
			},
			selectable: {
				enabled: true,
			},
			premovable: {
				enabled: false,
			},
			animation: {
				enabled: false,
				duration: 200,
			},
			drawable: {
				enabled: false,
			},
			draggable: {
				enabled: false,
			},
		});
	}

	private onMove(orig: board.Key, dest: board.Key, gotPiece?: board.Piece): void {
		this.disableMoves();
		if (!this.active) {
			this.start();
		}
		this.move.exec(orig, dest, 'q');
		this.display.updateStatus();
	}

	private afterMove(orig: board.Key, dest: board.Key) {
		// Pawn promotion.
		if (this.move.isPromotion()) {
			console.debug('Move was pawn promotion.');
			this.promotion.handle(orig, dest);
			this.display.updateStatus();
		}
		// Update clocks.
		this.clock.move(this.game.turn());
		// Save state.
		this.state.save().then(() => {
			console.debug('Game state saved.');
			this.enableMoves();
		});
	}

	private reset(): void {
		console.log('Game reset!');
		this.stop();
		this.game.reset();
		this.state.reset();
		this.move.updateBoard(undefined);
		this.display.updateStatus();
	}

	private disableMoves(): void {
		console.debug('Disable moves.');
		this.board.set({ movable: { color: null } });
	}

	private enableMoves(): void {
		console.debug('Enable moves.');
		this.board.set({ movable: { color: this.move.turnColor() } });
	}

	private disableBoard(): void {
		console.debug('Disable board.');
		this.display.clear();
		this.board.set({
			movable: {
				color: null,
			},
			selectable: {
				enabled: false,
			},
		});
	}

	private enableBoard(): void {
		console.debug('Enable board.');
		this.board.set({
			movable: {
				color: this.move.turnColor(),
			},
			selectable: {
				enabled: true,
			},
		});
		this.display.updateStatus();
	}

	private start(): void {
		console.debug('Game start.');
		this.clock.start();
		this.active = true;
	}

	private stop(): void {
		console.debug('Game stop.');
		this.clock.stop();
		this.active = false;
	}
}

export { ChessGame };
