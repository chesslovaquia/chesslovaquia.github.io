// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import {
	DEFAULT_POSITION,
	Move,
} from 'chess.js'

import { ClvqLocalStorage } from '../clvq/ClvqLocalStorage'

const stateIDPrefix: string = 'clvqChessGameState'
const stateVersion:  number = 10
const stateID:       string = `${stateIDPrefix}${stateVersion}`

class ChessGameState {
	private readonly storage: ClvqLocalStorage

	constructor() {
		this.storage = new ClvqLocalStorage()
		this.cleanupOld()
	}

	private cleanupOld(): void {
		this.storage.removeItem(stateIDPrefix)
		for (let v = 0; v < stateVersion; v++) {
			const sid = `${stateIDPrefix}${stateVersion}`
			this.storage.removeItem(sid)
		}
	}

	public reset(): void {
		this.storage.removeItem(stateID)
	}

	public savePgn(pgn: string): void {
		console.debug('Game state save pgn:', stateID)
		this.storage.setItem(stateID, pgn)
	}

	public getPgn(): string {
		console.debug('Game state get pgn:', stateID)
		const pgn = this.storage.getItem(stateID, "")
		console.debug('Game state got pgn:', pgn)
		return pgn
	}
}

export { ChessGameState }
