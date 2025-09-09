// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';
import { MovesSAN    } from '../engine/GameEngine';

import { GameError    } from './GameError';
import { GameClock    } from './GameClock';
import { ClockState   } from './GameClock';
import { GameSetup    } from './GameSetup';
import { SetupData    } from './GameSetup';
import { GameNavigate } from './GameNavigate';
import { NavState     } from './GameNavigate';

import { ClvqIndexedDB, Store } from '../clvq/ClvqIndexedDB';

type StateData = {
	moves:       MovesSAN,
	clock:       ClockState,
	nav:         NavState,
	orientation: EngineColor,
}

export class GameState {
	private readonly id:     string;
	private readonly engine: GameEngine;
	private readonly clock:  GameClock;
	private readonly db:     ClvqIndexedDB;
	private readonly setup:  GameSetup;
	private readonly nav:    GameNavigate;

	private orientation: EngineColor;
	private movesCount:  number;

	constructor(engine: GameEngine, clock: GameClock, nav: GameNavigate) {
		this.id          = 'current';
		this.engine      = engine;
		this.clock       = clock;
		this.nav         = nav;
		this.db          = new ClvqIndexedDB(Store.state);
		this.setup       = new GameSetup();
		this.orientation = 'w';
		this.movesCount  = 0;
	}

	public reset(): void {
		this.db.removeItem(this.id);
		this.setup.removeGame();
	}

	private getState(): StateData {
		const moves = this.engine.getState();
		this.movesCount = moves.length;
		return {
			moves: moves,
			clock: this.clock.getState(),
			nav: this.nav.getState(),
			orientation: this.orientation,
		}
	}

	public save(): void {
		this.db.setItem(this.id, this.getState()).then(() => {
			console.debug('State saved.')
		});
	}

	private setState(state: StateData): void {
		if (state.moves) {
			this.engine.setState(state.moves);
			this.movesCount = state.moves.length;
		}
		if (state.nav) {
			this.nav.setState(state.nav);
		}
		this.orientation = state.orientation;
		// Set clock state at the end so clock turn is correct.
		this.clock.setState(state.clock);
	}

	private async setSetupData(): Promise<void> {
		const data = await this.setup.getGame();
		if (data) {
			this.setup.setState(data);
		}
	}

	public async load(): Promise<boolean> {
		this.setSetupData();
		const state = await this.db.getItem(this.id);
		if (state) {
			this.setState(state);
			return true;
		}
		return false;
	}

	public async setupNewGame(): Promise<boolean> {
		const game = await this.setup.getGame();
		if (game) {
			console.debug('State setup new game:', game);
			this.clock.setupNewGame(game.time, game.increment);
			this.save();
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
		this.save();
	}

	public gameDescription(): string {
		return this.setup.description();
	}

	public isFirstMove(): boolean {
		console.debug('State if first move, count:', this.movesCount);
		return this.movesCount < 2 ? true : false;
	}
}
