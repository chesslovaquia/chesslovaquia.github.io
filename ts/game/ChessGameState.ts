// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqLocalStorage } from '../clvq/ClvqLocalStorage'

const stateID: string = 'clvqChessGameState'

class ChessGameState {
	private readonly storage: ClvqLocalStorage

	private state: string[]
	private idx:   number

	constructor(fen: string) {
		this.storage = new ClvqLocalStorage()
		this.state   = []
		this.idx     = -1
		this.push(fen)
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
		return this.state[-1]
	}

	public hasGame(): boolean {
		if (this.storage.getItem(stateID, "")) {
			return true
		}
		return false
	}

	public getGame(): string {
		return this.storage.getItem(stateID, "")
	}

	private saveState(): void {
		this.storage.setItem(stateID, this.last())
	}
}

export { ChessGameState }
