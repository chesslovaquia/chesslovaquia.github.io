// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';

import { ChessGameError } from './ChessGameError';
import { ChessGameClock } from './ChessGameClock';

import { ClvqIndexedDB } from '../clvq/ClvqIndexedDB';

const dbName    = 'clvqChessGame';
const dbStore   = 'state';
const dbVersion = 3;

class ChessGameState {
	private readonly game:  Chess;
	private readonly clock: ChessGameClock;
	private readonly db:    ClvqIndexedDB;

	constructor(game: Chess, clock: ChessGameClock) {
		this.game  = game;
		this.clock = clock;
		this.db    = new ClvqIndexedDB(dbName, dbStore, dbVersion);
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
		if (state.moves) {
			this.loadMoves(state.moves);
			this.clock.setState(state.clock);
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
			throw new ChessGameError(`Invalid move: ${gotError}`);
		}

	}
}

export { ChessGameState };
