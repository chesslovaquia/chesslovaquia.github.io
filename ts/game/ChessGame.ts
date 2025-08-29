// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess }  from 'chess.js';
import * as chess from 'chess.js';

import { ChessBoard } from '../board/ChessBoard';

import { EventBoardMove } from '../events/EventBoardMove';
import { BoardMoveData  } from '../events/EventBoardMove';

import { EventClockTimeout } from '../events/EventClockTimeout';

import { GameEngine    } from '../engine/GameEngine';
import { ChessjsEngine } from '../engine/ChessjsEngine';

import { GameConfig    } from './GameConfig';
import { GameDisplay   } from './GameDisplay';
import { GameError     } from './GameError';
import { GameMove      } from './GameMove';
import { GamePromotion } from './GamePromotion';
import { GameState     } from './GameState';
import { GamePlayer    } from './GamePlayer';
import { GameClock     } from './GameClock';
import { GameNavigate  } from './GameNavigate';

import { Color } from './types';

const clockInitialTime = 900; // Seconds.
const clockIncrement   = 10;  // Seconds.

export class ChessGame {
	private readonly engine:    GameEngine;
	private readonly game:      Chess;
	private readonly board:     ChessBoard;
	private readonly cfg:       GameConfig;
	private readonly move:      GameMove;
	private readonly promotion: GamePromotion;
	private readonly state:     GameState;
	private readonly display:   GameDisplay;
	private readonly clock:     GameClock;
	private readonly nav:       GameNavigate;

	private readonly p1: GamePlayer;
	private readonly p2: GamePlayer;

	private active: boolean;

	constructor(config: GameConfig) {
		console.debug('Game config:', config);
		this.cfg       = config;
		this.active    = false;
		this.engine    = new ChessjsEngine();
		this.game      = new Chess(chess.DEFAULT_POSITION);
		this.board     = new ChessBoard(this.cfg, this.engine);
		this.p1        = new GamePlayer("1");
		this.p2        = new GamePlayer("2");
		this.clock     = new GameClock(this.game, this.p1, this.p2, clockInitialTime, clockIncrement);
		this.nav       = new GameNavigate(this.cfg.ui, this.board, this.game);
		this.state     = new GameState(this.game, this.clock, this.nav);
		this.move      = new GameMove(this.game, this.board);
		this.display   = new GameDisplay(this.cfg, this.game, this.move);
		this.promotion = new GamePromotion(this.state, this.move, this.display, this.nav);
		if (this.board) {
			this.setupEventListeners();
			this.init();
		}
	}

	private init(): void {
		console.debug('Game init.');
		this.disableBoard();
		this.board.init();
		this.nav.addPosition();
		this.state.load().then((done) => {
			console.debug('Game load done:', done);
			if (done) {
				this.board.update(this.move.getLastMove());
				this.display.updateStatus();
				this.start();
			} else {
				this.setup();
			}
		});
	}

	private setupEventListeners(): void {
		console.debug('Game setup event listeners.');
		// Board events.
		EventBoardMove.Target.addEventListener(EventBoardMove.Name, (evt: Event) => {
			const e = evt as EventBoardMove;
			this.doMove(e.detail);
		});
		// Clock events.
		EventClockTimeout.Target.addEventListener(EventClockTimeout.Name, (evt: Event) => {
			const e = evt as EventClockTimeout;
			this.clockTimeout(e.detail.color);
		});
		// Game actions.
		this.cfg.ui.gameReset?.addEventListener('click', () => this.reset());
	}

	private doMove(move: BoardMoveData): void {
		console.debug('Game move:', move);
		if (!this.active) {
			this.start();
		}
		this.move.exec(move.orig, move.dest, 'q');
		this.display.updateStatus();
		this.afterMove(move);
	}

	private afterMove(move: BoardMoveData) {
		console.debug('Game after move:', move);
		if (this.move.isPromotion()) {
			// Pawn promotion.
			console.debug('Move was pawn promotion.');
			this.promotion.handle(move.orig, move.dest);
			this.display.updateStatus();
		} else {
			// Update clocks and save state.
			this.clock.move(this.game.turn());
			this.saveState();
		}
	}

	private saveState(): void {
		this.nav.addPosition();
		this.state.save();
		console.debug('Game state saved.');
	}

	private reset(): void {
		console.log('Game reset!');
		this.stop();
		this.game.reset();
		this.clock.reset();
		this.state.reset();
		this.board.reset();
		this.display.reset();
		this.display.updateStatus();
		this.setup();
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
		this.state.setupNewGame().then((done) => {
			console.debug('Game setup done:', done);
			if (done) {
				this.start();
			} else {
				window.location.replace('/');
			}
		});
	}

	private start(): void {
		console.debug('Game start.');
		this.enableBoard();
		this.clock.start();
		this.active = true;
	}

	private stop(): void {
		console.debug('Game stop.');
		this.disableBoard();
		this.clock.stop();
		this.state.save();
		this.active = false;
	}

	private clockTimeout(color: Color): void {
		console.debug('Game clock timeout:', color);
		this.stop();
		this.display.clockTimeout(color);
	}
}
