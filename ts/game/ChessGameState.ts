// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import {
	DEFAULT_POSITION,
	Move,
} from 'chess.js'

import { ClvqLocalStorage } from '../clvq/ClvqLocalStorage'

const stateIDPrefix: string = 'clvqChessGameState'
const stateVersion:  number = 0
const stateID:       string = `${stateIDPrefix}${stateVersion}`

class ChessGameState {
	private readonly storage: ClvqLocalStorage
	private readonly sep:     string

	constructor() {
		this.sep = ';'
		this.storage = new ClvqLocalStorage()
		this.cleanupOld()
	}

	private cleanupOld(): void {
		this.storage.removeItem(stateIDPrefix)
		for (let v = 0; v < stateVersion; v++) {
			const sid = `${stateIDPrefix}${v}`
			console.debug('Game state cleanup old:', sid)
			this.storage.removeItem(sid)
		}
	}

	public reset(): void {
		this.storage.removeItem(stateID)
	}

	public saveMoves(moves: string[]): void {
		console.debug('Game state save moves:', moves)
		this.storage.setItem(stateID, moves.join(this.sep))
	}

	public getMoves(): string[] {
		const moves = this.storage.getItem(stateID, '')
		console.debug('Game state got moves:', moves)
		if (moves) {
			return moves.split(this.sep)
		}
		return []
	}
}

export { ChessGameState }
