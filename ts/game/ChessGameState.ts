// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { DEFAULT_POSITION } from 'chess.js'

import { ClvqLocalStorage } from '../clvq/ClvqLocalStorage'

import { ChessGameData } from './ChessGameData'

const stateID: string = 'clvqChessGameState3'

class ChessGameState {
	private readonly storage: ClvqLocalStorage

	private state: string[]
	private idx:   number

	constructor() {
		this.storage = new ClvqLocalStorage()
		this.state   = []
		this.idx     = -1
	}

	private saveState(): void {
		this.storage.setItem(stateID, JSON.stringify(this.newData()))
	}

	private newData(): ChessGameData {
		const data = {
			fen:      this.last(),
			lastMove: [],
		}
		if (!data.fen) {
			data.fen = DEFAULT_POSITION
		}
		return data
	}

	public push(fen: string): void {
		// Remove any future states if we're not at the end.
		this.state = this.state.slice(0, this.idx + 1)
		// Save state.
		this.state.push(fen)
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

	public last(): string {
		return this.state[this.state.length - 1]
	}

	public clear(): void {
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
			return this.newData()
		}
		return data
	}
}

export { ChessGameState }
