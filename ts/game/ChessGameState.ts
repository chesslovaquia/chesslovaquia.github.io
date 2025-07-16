// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import {
	DEFAULT_POSITION,
	Move,
} from 'chess.js';

import { ClvqIndexedDB    } from '../clvq/ClvqIndexedDB';
import { ClvqLocalStorage } from '../clvq/ClvqLocalStorage';

const dbName    = 'clvqChessGame';
const dbStore   = 'state';
const dbVersion = 1;

class ChessGameState {
	private readonly db:  ClvqIndexedDB;
	private readonly sep: string;

	constructor() {
		this.db  = new ClvqIndexedDB(dbName, dbStore, dbVersion);
		this.sep = ';';
	}

	public reset(): void {
		this.db.removeItem('moves');
	}

	public async saveMoves(moves: string[]): Promise<void> {
		const m = moves.join(this.sep);
		if (m) {
			console.debug('Game state save moves:', m);
			this.db.setItem('moves', m);
		}
	}

	public async getMoves(): Promise<string[]> {
		const moves = await this.db.getItem('moves');
		if (moves) {
			console.debug('Game state got moves:', moves);
			return moves.split(this.sep);
		}
		return [];
	}
}

export { ChessGameState };
