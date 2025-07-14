// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import {
	DEFAULT_POSITION,
	Move,
} from 'chess.js'

import { ClvqLocalStorage } from '../clvq/ClvqLocalStorage'

import { ChessGameData } from './ChessGameData'

const stateID: string = 'clvqChessGameState4'

class ChessGameState {
	private readonly storage: ClvqLocalStorage

	private state: ChessGameData[]
	private idx:   number

	constructor() {
		this.storage = new ClvqLocalStorage()
		this.state   = []
		this.idx     = -1
	}

	private last(): ChessGameData {
		return this.state[this.state.length - 1]
	}

	private saveState(): void {
		this.storage.setItem(stateID, JSON.stringify(this.last()))
	}

	private newData(fen: string, curMove: Move | null): ChessGameData {
		if (curMove !== null) {
			return {
				fen: fen,
				lastMove: [curMove.from, curMove.to],
			}
		}
		return {
			fen: fen,
			lastMove: [],
		}
	}

	public push(fen: string, curMove: Move): void {
		// Remove any future states if we're not at the end.
		this.state = this.state.slice(0, this.idx + 1)
		// Save state.
		this.state.push(this.newData(fen, curMove))
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
		const data = JSON.parse(this.storage.getItem(stateID, "{}"))
		if (!data) {
			console.error('Game state invalid data:', data)
			return this.newData(DEFAULT_POSITION, null)
		}
		return data
	}
}

export { ChessGameState }
