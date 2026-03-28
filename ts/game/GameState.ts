// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';
import { MovesSAN    } from '../engine/GameEngine';

import { GameClock    } from './GameClock';
import { ClockState   } from './GameClock';
import { GameSetup    } from './GameSetup';
import { GameNavigate } from './GameNavigate';

import { logger } from '../clvq/Logger';

import { ClvqIndexedDB, Store } from '../clvq/ClvqIndexedDB';

import { GameHistory  } from './GameHistory';
import { HistoryRecord } from './GameHistory';

type StateData = {
	moves:           MovesSAN,
	clock:           ClockState,
	orientation:     EngineColor,
	description:     string,
	timeControlDesc: string,
}

export interface GameState {
	reset():             void;
	save():              Promise<void>;
	load():              Promise<boolean>;
	setupNewGame():      Promise<boolean>;
	getOrientation():    EngineColor;
	toggleOrientation(): void;
	gameDescription():   string;
	saveToHistory(
		white:      string,
		black:      string,
		result:     string,
		source?:    'local' | 'lichess',
		lichessId?: string,
	): Promise<void>;
}

export class GameStateImpl implements GameState {
	private readonly id:      string;
	private readonly engine:  GameEngine;
	private readonly clock:   GameClock;
	private readonly db:      ClvqIndexedDB<StateData>;
	private readonly setup:   GameSetup;
	private readonly nav:     GameNavigate;
	private readonly history: GameHistory;

	private orientation:     EngineColor;
	private description:     string;
	private timeControlDesc: string;

	constructor(engine: GameEngine, clock: GameClock, nav: GameNavigate, setup: GameSetup, history: GameHistory) {
		this.id              = 'current';
		this.engine          = engine;
		this.clock           = clock;
		this.nav             = nav;
		this.db              = new ClvqIndexedDB<StateData>(Store.state);
		this.setup           = setup;
		this.history         = history;
		this.orientation     = 'w';
		this.description     = '';
		this.timeControlDesc = '-';
	}

	public reset(): void {
		this.db.removeItem(this.id).catch((err: unknown) => logger.error('State reset error:', err));
		this.setup.removeGame();
	}

	private getState(): StateData {
		return {
			moves:           this.engine.getState(),
			clock:           this.clock.getState(),
			orientation:     this.orientation,
			description:     this.description,
			timeControlDesc: this.timeControlDesc,
		}
	}

	public async save(): Promise<void> {
		try {
			await this.db.setItem(this.id, this.getState());
			logger.debug('State saved.');
		} catch (err) {
			logger.error('State save error:', err);
		}
	}

	private setState(state: StateData): void {
		this.description     = state.description;
		this.timeControlDesc = state.timeControlDesc;
		this.orientation     = state.orientation;
		// Replay moves one at a time, rebuilding nav positions.
		if (state.moves) {
			this.engine.setState(state.moves, () => {
				this.nav.addPosition();
			});
		}
		// Set clock state at the end so clock turn is correct.
		this.clock.setState(state.clock);
	}

	public async load(): Promise<boolean> {
		const state = await this.db.getItem(this.id);
		if (state) {
			this.setState(state);
			return true;
		}
		return false;
	}

	public async setupNewGame(): Promise<boolean> {
		const game = this.setup.getGame();
		if (game) {
			logger.debug('State setup new game:', game);
			this.description     = game.desc;
			this.timeControlDesc = `${game.time}+${game.increment}`;
			this.clock.setupNewGame(game.time, game.increment);
			if (game.correspondence) {
				this.clock.disableFirstMoveTimer();
			}
			await this.save();
			return true;
		}
		return false;
	}

	public getOrientation(): EngineColor {
		return this.orientation;
	}

	public toggleOrientation(): void {
		if (this.orientation === 'w') {
			this.orientation = 'b';
		} else {
			this.orientation = 'w';
		}
		this.save().catch((err: unknown) => logger.error('State save error:', err));
	}

	public gameDescription(): string {
		return this.description || 'NOGAME';
	}

	public async saveToHistory(
		white:      string,
		black:      string,
		result:     string,
		source:     'local' | 'lichess' = 'local',
		lichessId?: string,
	): Promise<void> {
		try {
			const now  = new Date();
			const date = now.toISOString();
			const pgnDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
			const headers: Record<string, string> = {
				Date:        pgnDate,
				White:       white,
				Black:       black,
				Result:      result,
				TimeControl: this.timeControlDesc,
				Event:       this.description,
			};
			const pgn = this.engine.pgn(headers);
			const record: HistoryRecord = {
				id:          `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
				date,
				white,
				black,
				result,
				timeControl: this.timeControlDesc,
				pgn,
				source,
				lichessId,
			};
			await this.history.save(record);
			logger.debug('History saved:', record.id);
		} catch (err) {
			logger.error('History save error:', err);
		}
	}
}
