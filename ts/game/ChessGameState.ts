class ChessGameState {
	private state: string[]
	private idx: number

	constructor(fen: string) {
		this.state = []
		this.idx = -1
		this.push(fen)
	}

	public push(fen: string): void {
		// Remove any future states if we're not at the end.
		this.state = this.state.slice(0, this.idx + 1)
		// Save state.
		this.state.push(fen)
		this.idx++
		console.log(this.idx, fen)
	}

	public pop(): boolean {
		if (this.state.pop()) {
			this.idx--
			return true
		}
		return false
	}
}

export { ChessGameState }
