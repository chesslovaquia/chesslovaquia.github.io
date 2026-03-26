// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameBoard  } from '../board/GameBoard';
import { BoardColor } from '../board/GameBoard';
import { BoardMove  } from '../board/GameBoard';

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';
import { EngineMove  } from '../engine/GameEngine';

import { EventBoardMove    } from '../events/EventBoardMove';
import { EventClockTimeout } from '../events/EventClockTimeout';
import { EventOpponentMove } from '../events/EventOpponentMove';
import { EventGameOver     } from '../events/EventGameOver';

import { GameDeps      } from './GameDeps';
import { GameConfig    } from './GameConfig';
import { GameDisplay   } from './GameDisplay';
import { GameError     } from './GameError';
import { GameMove      } from './GameMove';
import { GamePromotion } from './GamePromotion';
import { GameState     } from './GameState';
import { GameClock     } from './GameClock';
import { GameNavigate  } from './GameNavigate';

import { logger } from '../clvq/Logger';
import * as utils from '../clvq/utils';

export class ChessGame {
	private readonly cfg:         GameConfig;
	private readonly engine:      GameEngine;
	private readonly board:       GameBoard;
	private readonly clock:       GameClock;
	private readonly nav:         GameNavigate;
	private readonly state:       GameState;
	private readonly move:        GameMove;
	private readonly promotion:   GamePromotion;
	private readonly display:     GameDisplay;
	private readonly onMove?:     (uci: string) => Promise<void>;
	private readonly playerColor?: BoardColor;
	private readonly white:       string;
	private readonly black:       string;

	private active: boolean;

	private readonly boardMoveHandler:    (evt: Event) => void;
	private readonly clockTimeoutHandler: (evt: Event) => void;
	private readonly opponentMoveHandler: (evt: Event) => void;
	private readonly gameOverHandler:     (evt: Event) => void;

	constructor(deps: GameDeps) {
		this.active      = false;
		this.cfg         = deps.cfg;
		this.engine      = deps.engine;
		this.board       = deps.board;
		this.clock       = deps.clock;
		this.nav         = deps.nav;
		this.state       = deps.state;
		this.onMove      = deps.onMove;
		this.playerColor = deps.playerColor;
		this.white       = deps.white ?? 'White';
		this.black       = deps.black ?? 'Black';
		this.move        = new GameMove(this.engine, this.board);
		this.display     = new GameDisplay(this.cfg, this.engine, this.move);
		this.promotion   = new GamePromotion(this.state, this.move, this.display, this.nav);
		this.boardMoveHandler = (evt: Event) => {
			const e = evt as EventBoardMove;
			this.doMove(e.detail);
		};
		this.clockTimeoutHandler = (evt: Event) => {
			const e = evt as EventClockTimeout;
			this.clockTimeout(e.detail.color);
		};
		this.opponentMoveHandler = (evt: Event) => {
			const e = evt as EventOpponentMove;
			this.doOpponentMove(e.detail);
		};
		this.gameOverHandler = (evt: Event) => {
			const e = evt as EventGameOver;
			this.onGameOver(e.detail.reason, e.detail.winner);
		};
		this.setupEventListeners();
	}

	public destroy(): void {
		this.clock.stop();
		EventBoardMove.Target.removeEventListener(EventBoardMove.Name, this.boardMoveHandler);
		EventClockTimeout.Target.removeEventListener(EventClockTimeout.Name, this.clockTimeoutHandler);
		EventOpponentMove.Target.removeEventListener(EventOpponentMove.Name, this.opponentMoveHandler);
		EventGameOver.Target.removeEventListener(EventGameOver.Name, this.gameOverHandler);
	}

	public init(): void {
		logger.debug('Game init.');
		this.board.init();
		this.disableBoard();
		this.nav.addPosition();
		this.state.load().then((done) => {
			logger.debug('Game load done:', done);
			if (done) {
				this.board.update();
				this.display.updateStatus();
				const orientation = this.state.getOrientation();
				if (orientation === 'b') {
					logger.debug('Game load flip board.');
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
		logger.debug('Game setup event listeners.');
		// Board events.
		EventBoardMove.Target.addEventListener(EventBoardMove.Name, this.boardMoveHandler);
		// Clock events.
		EventClockTimeout.Target.addEventListener(EventClockTimeout.Name, this.clockTimeoutHandler);
		// Online mode events.
		EventOpponentMove.Target.addEventListener(EventOpponentMove.Name, this.opponentMoveHandler);
		EventGameOver.Target.addEventListener(EventGameOver.Name, this.gameOverHandler);
		// Game actions.
		this.cfg.ui.gameReset?.addEventListener('click', () => this.reset());
		this.cfg.ui.flipBoard?.addEventListener('click', () => this.flipBoard());
	}

	private doMove(move: EngineMove): void {
		logger.debug('Game move:', move);
		if (!this.active) {
			this.start();
		}
		this.move.exec(move.from, move.to, 'q');
		this.afterMove(move);
	}

	private afterMove(move: EngineMove) {
		logger.debug('Game after move.');
		if (this.engine.isPromotion()) {
			// Pawn promotion.
			logger.debug('Move was pawn promotion.');
			this.promotion.handle(move);
		} else {
			const turn = this.engine.turn();
			// Update clocks and save state.
			this.clock.move(turn);
			// Check outcome.
			if (this.engine.isGameOver()) {
				// Game over.
				this.stop();
				if (!this.onMove) {
					this.saveHistory(this.computeResult(), 'local');
				}
			}
			// Save state
			this.saveState();
		}
		this.display.updateStatus();
	}

	private computeResult(): string {
		if (this.engine.isCheckmate()) {
			return this.engine.turn() === 'w' ? '0-1' : '1-0';
		}
		if (this.engine.isDraw() || this.engine.isStalemate() ||
			this.engine.isThreefoldRepetition() || this.engine.isInsufficientMaterial()) {
			return '1/2-1/2';
		}
		return '*';
	}

	private saveHistory(result: string, source: 'local' | 'lichess', lichessId?: string): void {
		this.state.saveToHistory(this.white, this.black, result, source, lichessId)
			.catch((err: unknown) => logger.error('History save error:', err));
	}

	private saveState(): void {
		this.nav.addPosition();
		this.state.save();
		if (this.onMove) {
			const uci = this.buildLastMoveUCI();
			if (uci) {
				this.onMove(uci).catch((err: unknown) => logger.error('Move submit error:', err));
				this.disableBoard();
			}
		}
		logger.debug('Game state saved.');
	}

	private buildLastMoveUCI(): string {
		const last = this.engine.lastMove();
		if (!last) return '';
		const moves = this.engine.getState();
		const lastSAN = moves.length > 0 ? moves[moves.length - 1] : '';
		const promoMatch = lastSAN.match(/=([QRBNqrbn])/);
		const piece = promoMatch ? promoMatch[1].toLowerCase() : '';
		return last.from + last.to + piece;
	}

	// Handles an opponent move received from the lichess stream.
	// Does not trigger the promotion dialog or the onMove submission.
	private doOpponentMove(move: EngineMove): void {
		logger.debug('Game opponent move:', move);
		if (!this.active) {
			this.start();
		}
		this.move.exec(move.from, move.to, move.promotion);
		const turn = this.engine.turn();
		this.clock.move(turn);
		if (this.engine.isGameOver()) {
			this.stop();
		} else {
			this.nav.addPosition();
			this.state.save();
			if (this.isMyTurn()) {
				this.enableBoard();
			}
		}
		this.display.updateStatus();
	}

	private onGameOver(reason: string, winner?: string): void {
		if (!this.active) return;
		logger.debug('Game online game over:', reason, winner);
		this.stop();
		this.display.onlineGameOver(reason, winner);
	}

	private isMyTurn(): boolean {
		if (!this.playerColor) return true;
		return this.move.turnColor() === this.playerColor;
	}

	private reset(): void {
		logger.debug('Game reset!');
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
			logger.debug('Game setup done:', done);
			if (done) {
				this.start();
			} else {
				window.location.assign('/');
			}
		});
	}

	private start(): void {
		logger.debug('Game start.');
		this.display.setDescription(this.state.gameDescription());
		this.enableBoard();
		if (!this.isMyTurn()) {
			this.board.disable();
		}
		this.clock.start();
		this.active = true;
	}

	private stop(): void {
		logger.debug('Game stop.');
		this.disableBoard();
		this.clock.stop();
		this.active = false;
	}

	private clockTimeout(color: EngineColor): void {
		logger.debug('Game clock timeout:', color);
		this.stop();
		this.display.clockTimeout(color);
		if (!this.onMove) {
			const result = color === 'w' ? '0-1' : '1-0';
			this.saveHistory(result, 'local');
		}
	}

	private toggleOrientation(): void {
		this.board.flip();
		this.clock.flip();
		this.nav.flip();
	}

	private flipBoard(): void {
		logger.debug('Game flip board.');
		this.toggleOrientation();
		this.state.toggleOrientation();
	}
}
