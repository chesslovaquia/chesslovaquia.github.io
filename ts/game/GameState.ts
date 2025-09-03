// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';

import { GameError    } from './GameError';
import { GameClock    } from './GameClock';
import { GameSetup    } from './GameSetup';
import { GameNavigate } from './GameNavigate';

import { ClvqIndexedDB, Store } from '../clvq/ClvqIndexedDB';

export class GameState {
	private readonly id:     string;
	private readonly engine: GameEngine;
	private readonly clock:  GameClock;
	private readonly db:     ClvqIndexedDB;
	private readonly setup:  GameSetup;
	private readonly nav:    GameNavigate;

	private orientation: EngineColor;

	constructor(engine: GameEngine, clock: GameClock, nav: GameNavigate) {
		this.id          = 'current';
		this.engine      = engine;
		this.clock       = clock;
		this.nav         = nav;
		this.db          = new ClvqIndexedDB(Store.state);
		this.setup       = new GameSetup();
		this.orientation = 'w';
	}

	public reset(): void {
		this.db.removeItem(this.id);
	}

	public save(): void {
		this.db.setItem(this.id, {
			moves:       this.engine.getState(),
			clock:       this.clock.getState(),
			nav:         this.nav.getState(),
			orientation: this.orientation,
		}).then(() => { console.debug('State saved.') });
	}

	public async load(): Promise<boolean> {
		const state = await this.db.getItem(this.id);
		if (state) {
			if (state.moves) {
				this.engine.setState(state.moves);
			}
			if (state.nav) {
				this.nav.setState(state.nav);
			}
			// Set clock state after loading moves so clock turn is correct.
			this.clock.setState(state.clock);
			this.orientation = state.orientation;
			return true;
		}
		return false;
	}

	public async setupNewGame(): Promise<boolean> {
		const newGame = await this.setup.getGame();
		if (newGame) {
			console.debug('State setup new game:', newGame);
			this.clock.setupNewGame(newGame.time, newGame.increment);
			this.setup.removeGame();
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
}
