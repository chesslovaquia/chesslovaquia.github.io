// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess }   from 'chess.js';
import * as chess  from 'chess.js';

import { ChessBoard } from '../board/ChessBoard';

import { EventBoardMove      } from '../events/EventBoardMove';
import { BoardMoveData       } from '../events/EventBoardMove';
import { EventBoardAfterMove } from '../events/EventBoardAfterMove';
import { BoardAfterMoveData  } from '../events/EventBoardAfterMove';
import { EventClockTimeout   } from '../events/EventClockTimeout';

import { GameConfig    } from './GameConfig';
import { GameDisplay   } from './GameDisplay';
import { GameError     } from './GameError';
import { GameMove      } from './GameMove';
import { GamePromotion } from './GamePromotion';
import { GameState     } from './GameState';
import { GamePlayer    } from './GamePlayer';
import { GameClock     } from './GameClock';

import { Color } from './types';

const clockInitialTime = 900; // Seconds.
const clockIncrement   = 10;  // Seconds.

class ChessGame {
	private readonly id:        string;
	private readonly game:      Chess;
	private readonly board:     ChessBoard;
	private readonly cfg:       GameConfig;
	private readonly move:      GameMove;
	private readonly promotion: GamePromotion;
	private readonly state:     GameState;
	private readonly display:   GameDisplay;
	private readonly clock:     GameClock;

	private readonly p1: GamePlayer;
	private readonly p2: GamePlayer;

	private active: boolean;

	constructor(config: GameConfig) {
		console.debug('Game config:', config);
		this.cfg       = config;
		this.id        = 'current'; // FIXME: generate internal game ID
		this.active    = false;
		this.game      = new Chess(chess.DEFAULT_POSITION);
		this.board     = new ChessBoard(this.cfg, this.game);
		this.p1        = new GamePlayer("1");
		this.p2        = new GamePlayer("2");
		this.clock     = new GameClock(this.game, this.p1, this.p2, clockInitialTime, clockIncrement);
		this.state     = new GameState(this.game, this.clock);
		this.move      = new GameMove(this.game, this.board);
		this.display   = new GameDisplay(this.cfg, this.game, this.move);
		this.promotion = new GamePromotion(this.id, this.state, this.move, this.display);
		if (this.board) {
			this.setupEventListeners();
			this.init();
		}
	}

	private init(): void {
		console.debug('Game init.');
		this.disableBoard();
		this.board.init();
		this.state.load(this.id).then((done) => {
			console.debug('Game load done:', done);
			if (done) {
				this.board.update(this.move.getLastMove());
				this.display.updateStatus();
				this.start();
			} else {
				this.setup();
			}
		});
		this.enableBoard();
	}

	private setupEventListeners(): void {
		console.debug('Game setup event listeners.');
		// Board events.
		document.addEventListener('clvqBoardMove', (evt: Event) => {
			const e = evt as EventBoardMove;
			this.onMove(e.detail);
		});
		document.addEventListener('clvqBoardAfterMove', (evt: Event) => {
			const e = evt as EventBoardAfterMove;
			this.afterMove(e.detail);
		});
		// Clock events.
		document.addEventListener('clvqClockTimeout', (evt: Event) => {
			const e = evt as EventClockTimeout;
			this.clockTimeout(e.detail.color);
		});
		// Game menu.
		this.cfg.ui.gameReset?.addEventListener('click', () => this.reset());
		// Game setup.
		this.cfg.ui.gameStart?.addEventListener('click', () => this.start());
	}

	private onMove(data: BoardMoveData): void {
		if (!this.active) {
			this.start();
		}
		this.move.exec(data.orig, data.dest, 'q');
		this.display.updateStatus();
	}

	private afterMove(data: BoardAfterMoveData) {
		// Pawn promotion.
		if (this.move.isPromotion()) {
			console.debug('Move was pawn promotion.');
			this.promotion.handle(data.orig, data.dest);
			this.display.updateStatus();
		} else {
			// Update clocks.
			this.clock.move(this.game.turn());
			this.saveState();
		}
	}

	private saveState(): void {
		this.state.save(this.id).finally(() => {
			console.debug('Game state saved.');
		});
	}

	private reset(): void {
		console.log('Game reset!');
		this.stop();
		this.game.reset();
		this.clock.reset();
		this.state.reset(this.id);
		this.board.update(undefined);
		this.display.reset();
		this.display.updateStatus();
		this.setup();
		this.enableBoard();
	}

	private disableBoard(): void {
		this.board.disable();
		this.display.clear();
	}

	private enableBoard(): void {
		this.board.enable();
		this.display.updateStatus();
	}

	private setup(): void {
		this.cfg.ui.gameSetupModal?.classList.toggle('w3-show', true);
	}

	private start(): void {
		console.debug('Game start.');
		this.clock.start();
		this.active = true;
	}

	private stop(): void {
		console.debug('Game stop.');
		this.disableBoard();
		this.clock.stop();
		this.state.save(this.id);
		this.active = false;
	}

	private clockTimeout(color: Color): void {
		console.debug('Game clock timeout:', color);
		this.stop();
		this.display.clockTimeout(color);
	}
}

export { ChessGame };
