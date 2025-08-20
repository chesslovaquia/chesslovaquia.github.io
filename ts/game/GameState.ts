// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';

import { GameError } from './GameError';
import { GameClock } from './GameClock';
import { GameSetup } from './GameSetup';

import { GameData  } from './types';

import { ClvqIndexedDB, Store } from '../clvq/ClvqIndexedDB';

export class GameState {
	private readonly game:  Chess;
	private readonly clock: GameClock;
	private readonly db:    ClvqIndexedDB;
	private readonly setup: GameSetup;

	constructor(game: Chess, clock: GameClock) {
		this.game  = game;
		this.clock = clock;
		this.db    = new ClvqIndexedDB(Store.state);
		this.setup = new GameSetup();
	}

	public reset(id: string): void {
		this.db.removeItem(id);
	}

	public async save(id: string): Promise<void> {
		await this.db.setItem(id, {
			moves: this.game.history(),
			clock: this.clock.getState(),
		});
	}

	public async load(id: string): Promise<boolean> {
		const state = await this.db.getItem(id);
		if (state) {
			this.clock.setState(state.clock);
			if (state.moves) {
				this.loadMoves(state.moves);
			}
			return true;
		}
		return false;
	}

	private loadMoves(moves: string[]): void {
		console.debug('Game load moves:', moves);
		this.game.reset();
		let gotError = '';
		moves.every(san => {
			const move = this.game.move(san, { strict: true });
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
			this.save('current');
			return true;
		}
		return false;
	}
}
