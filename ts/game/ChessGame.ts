// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chessground }           from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';

import * as board from 'chessground/types';
import * as game  from 'chess.js';

import { ChessGameConfig }    from './ChessGameConfig';
import { ChessGameDisplay }   from './ChessGameDisplay';
import { ChessGameError }     from './ChessGameError';
import { ChessGameMove }      from './ChessGameMove';
import { ChessGamePromotion } from './ChessGamePromotion';
import { ChessGameState }     from './ChessGameState';

class ChessGame {
	private readonly game:      game.Chess;
	private readonly board:     ChessgroundApi;
	private readonly move:      ChessGameMove;
	private readonly promotion: ChessGamePromotion;
	private readonly state:     ChessGameState;
	private readonly display:   ChessGameDisplay;

	constructor(config: ChessGameConfig) {
		console.debug('Game config:', config);
		// Respect the order.
		this.game      = this.newGame();
		this.board     = this.newBoard(config);
		this.state     = new ChessGameState();
		this.move      = new ChessGameMove(this.game, this.board, this.state);
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
		this.loadGame().then((result) => {
			console.debug('Game load done:', result);
			this.move.updateBoard(this.move.getLastMove());
			this.enableBoard();
		});
	}

	private setupEventListeners(cfg: ChessGameConfig): void {
		console.debug('Game setup event listeners.');
		// Toggle board screen.
		window.addEventListener('resize', this.display.toggleBoardScreen);
		window.addEventListener('load',   this.display.toggleBoardScreen);
		// Game reset button.
		cfg.resetButtonLaptop?.addEventListener('click', () => this.reset());
		cfg.resetButtonMobile?.addEventListener('click', () => this.reset());
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
		this.move.exec(orig, dest, 'q');
		this.display.updateStatus();
	}

	private afterMove(orig: board.Key, dest: board.Key) {
		// Pawn promotion.
		if (this.move.isPromotion()) {
			console.log('Move was pawn promotion.');
			this.promotion.handle(orig, dest);
			this.display.updateStatus();
		}
	}

	private reset(): void {
		console.log('Game reset!');
		this.game.reset();
		this.move.reset();
		this.state.reset();
		this.move.updateBoard(undefined);
		this.display.updateStatus();
	}

	private async loadGame(): Promise<boolean> {
		const moves = await this.state.getMoves();
		if (moves.length > 0) {
			try {
				this.move.loadMoves(moves);
				return true;
			} catch(err) {
				console.error('Game moves load failed:', err);
				this.game.reset();
				this.move.reset();
				this.state.reset();
			}
		} else {
			console.debug('No saved moves to load.');
		}
		return false;
	}

	private disableBoard(): void {
		console.debug('Disable board.');
		this.display.clear();
		this.board.set({
			selectable: {
				enabled: false,
			},
		});
	}

	private enableBoard(): void {
		console.debug('Enable board.');
		this.board.set({
			selectable: {
				enabled: true,
			},
		});
		this.display.updateStatus();
	}
}

export { ChessGame };
