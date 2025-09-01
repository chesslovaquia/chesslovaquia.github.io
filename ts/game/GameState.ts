// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine } from '../engine/GameEngine';

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

	constructor(engine: GameEngine, clock: GameClock, nav: GameNavigate) {
		this.id     = 'current';
		this.engine = engine;
		this.clock  = clock;
		this.nav    = nav;
		this.db     = new ClvqIndexedDB(Store.state);
		this.setup  = new GameSetup();
	}

	public reset(): void {
		this.db.removeItem(this.id);
	}

	public save(): void {
		this.db.setItem(this.id, {
			moves: this.engine.history(),
			clock: this.clock.getState(),
			nav:   this.nav.getState(),
		}).then(() => { console.debug('State saved.') });
	}

	public async load(): Promise<boolean> {
		const state = await this.db.getItem(this.id);
		if (state) {
			if (state.moves) {
				this.loadMoves(state.moves);
			}
			if (state.nav) {
				this.nav.setState(state.nav);
			}
			// Set clock state after loading moves so clock turn is correct.
			this.clock.setState(state.clock);
			return true;
		}
		return false;
	}

	private loadMoves(moves: string[]): void {
		console.debug('Game load moves:', moves);
		this.engine.reset();
		let gotError = '';
		moves.every(san => {
			const move = this.engine.move({san: san});
			if (move) {
				return true;
			} else {
				gotError = san;
				return false;
			}
		});
		if (gotError !== '') {
			throw new GameError(`Invalid move: ${gotError}`);
		}
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
}
