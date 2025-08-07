// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessGameClock } from './ChessGameClock';

import { ClvqIndexedDB } from '../clvq/ClvqIndexedDB';

const dbName    = 'clvqChessGame';
const dbStore   = 'state';
const dbVersion = 2;

class ChessGameState {
	private readonly clock: ChessGameClock;
	private readonly db:    ClvqIndexedDB;

	constructor(clock: ChessGameClock) {
		this.clock = clock;
		this.db    = new ClvqIndexedDB(dbName, dbStore, dbVersion);
	}

	public reset(): void {
		this.db.removeItem('moves');
	}

	public async saveMoves(moves: string[]): Promise<void> {
		if (moves) {
			console.debug('Game state save moves:', moves);
			this.db.setItem('moves', moves);
		}
	}

	public async getMoves(): Promise<string[]> {
		const found = await this.db.hasItem('moves');
		if (found) {
			const moves = await this.db.getItem('moves');
			console.debug('Game state got moves:', moves);
			return moves;
		}
		return [];
	}

	public save(): void {
	}

	public load(): void {
	}
}

export { ChessGameState };
