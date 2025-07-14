// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import {
	DEFAULT_POSITION,
	Move,
} from 'chess.js'

import { ClvqLocalStorage } from '../clvq/ClvqLocalStorage'

import { ChessGameData, ChessGameDataMove } from './ChessGameData'

const stateIDPrefix: string = 'clvqChessGameState'
const stateVersion:  number = 7
const stateID:       string = `${stateIDPrefix}${stateVersion}`

class ChessGameState {
	private readonly storage: ClvqLocalStorage

	private state: string[]
	private idx:   number

	constructor() {
		this.storage = new ClvqLocalStorage()
		this.state   = []
		this.idx     = -1
		this.cleanup()
	}

	private cleanup(): void {
		this.storage.removeItem(stateIDPrefix)
		for (let v = 0; v < stateVersion; v++) {
			const sid = `${stateIDPrefix}${stateVersion}`
			this.storage.removeItem(sid)
		}
	}

	private last(): ChessGameData {
		return this.state[this.state.length - 1]
	}

	private saveState(): void {
		this.storage.setItem(stateID, JSON.stringify(this.last()))
	}

	private newData(fen: string, c: ChessGameDataMove, p: ChessGameDataMove): ChessGameData {
		return {
			fen: fen,
			curMove: c,
			prevMove: p,
		}
	}

	public push(fen: string, cur: ChessGameDataMove, prev: ChessGameDataMove): void {
		// Remove any future states if we're not at the end.
		this.state = this.state.slice(0, this.idx + 1)
		// Save state.
		this.state.push(this.newData(fen, cur, prev))
		this.idx++
		this.saveState()
	}

	public pop(): boolean {
		if (this.state.pop()) {
			this.idx--
			this.saveState()
			return true
		}
		return false
	}

	public reset(): void {
		this.state = []
		this.idx   = -1
		this.storage.removeItem(stateID)
	}

	public hasGame(): boolean {
		if (this.storage.getItem(stateID, "")) {
			return true
		}
		return false
	}

	public getGame(): ChessGameData {
		return JSON.parse(this.storage.getItem(stateID, "{}"))
	}
}

export { ChessGameState }
