// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameBoard } from '../board/GameBoard';
import { BoardMove } from '../board/GameBoard';

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';
import { EngineMove  } from '../engine/GameEngine';

import { EventBoardMove    } from '../events/EventBoardMove';
import { EventClockTimeout } from '../events/EventClockTimeout';

import { GameDeps      } from './GameDeps';
import { GameConfig    } from './GameConfig';
import { GameDisplay   } from './GameDisplay';
import { GameError     } from './GameError';
import { GameMove      } from './GameMove';
import { GamePromotion } from './GamePromotion';
import { GameState     } from './GameState';
import { GameClock     } from './GameClock';
import { GameNavigate  } from './GameNavigate';

import * as utils from '../clvq/utils';

export class ChessGame {
	private readonly cfg: GameConfig;
	private readonly engine: GameEngine;
	private readonly board: GameBoard;
	private readonly clock: GameClock;
	private readonly nav: GameNavigate;
	private readonly state: GameState;
	private readonly move: GameMove;
	private readonly promotion: GamePromotion;
	private readonly display: GameDisplay;

	private active: boolean;

	constructor(deps: GameDeps) {
		this.active = false;
		this.cfg = deps.cfg;
		this.engine = deps.engine;
		this.board = deps.board;
		this.clock = deps.clock;
		this.nav = deps.nav;
		this.state = deps.state;
		this.move = new GameMove(this.engine, this.board);
		this.display = new GameDisplay(this.cfg, this.engine, this.move);
		this.promotion = new GamePromotion(this.state, this.move, this.display, this.nav);
		this.setupEventListeners();
	}

	public init(): void {
		console.debug('Game init.');
		this.board.init();
		this.disableBoard();
		this.nav.addPosition();
		this.state.load().then((done) => {
			console.debug('Game load done:', done);
			if (done) {
				this.board.update();
				this.display.updateStatus();
				const orientation = this.state.getOrientation();
				if (orientation === 'b') {
					console.debug('Game load flip board.');
					this.toggleOrientation();
				}
				if (this.engine.isGameOver()) {
					// Game over.
					this.stop();
					this.display.setDescription(this.state.gameDescription());
					this.display.updateStatus();
				} else {
					this.start();
				}
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
		this.cfg.ui.flipBoard?.addEventListener('click', () => this.flipBoard());
	}

	private doMove(move: EngineMove): void {
		console.debug('Game move:', move);
		if (!this.active) {
			this.start();
		}
		this.move.exec(move.from, move.to, 'q');
		this.afterMove(move);
	}

	private afterMove(move: EngineMove) {
		console.debug('Game after move.');
		if (this.engine.isPromotion()) {
			// Pawn promotion.
			console.debug('Move was pawn promotion.');
			this.promotion.handle(move);
		} else {
			const turn = this.engine.turn();
			// Update clocks and save state.
			this.clock.move(turn);
			// Check outcome.
			if (this.engine.isGameOver()) {
				// Game over.
				this.stop();
			}
			// Save state
			this.saveState();
		}
		this.display.updateStatus();
	}

	private saveState(): void {
		this.nav.addPosition();
		this.state.save();
		console.debug('Game state saved.');
	}

	private reset(): void {
		console.log('Game reset!');
		this.state.reset();
		window.location.assign('/');
	}

	private disableBoard(): void {
		this.board.disable();
		this.display.clear();
		utils.disableButton(this.cfg.ui.flipBoard);
	}

	private enableBoard(): void {
		this.board.enable();
		this.display.updateStatus();
		utils.enableButton(this.cfg.ui.flipBoard);
	}

	private setup(): void {
		this.state.setupNewGame().then((done) => {
			console.debug('Game setup done:', done);
			if (done) {
				this.start();
			} else {
				window.location.assign('/');
			}
		});
	}

	private start(): void {
		console.debug('Game start.');
		this.display.setDescription(this.state.gameDescription());
		this.enableBoard();
		this.clock.start();
		this.active = true;
	}

	private stop(): void {
		console.debug('Game stop.');
		this.disableBoard();
		this.clock.stop();
		this.active = false;
	}

	private clockTimeout(color: EngineColor): void {
		console.debug('Game clock timeout:', color);
		this.stop();
		this.display.clockTimeout(color);
	}

	private toggleOrientation(): void {
		this.board.flip();
		this.clock.flip();
		this.nav.flip();
	}

	private flipBoard(): void {
		console.debug('Game flip board.');
		this.toggleOrientation();
		this.state.toggleOrientation();
	}
}
