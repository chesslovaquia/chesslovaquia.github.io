class ChessGameConfig {
	public boardElement: HTMLElement
	public statusElement: HTMLElement | undefined
	public resetButton: HTMLElement | undefined
	public undoButton: HTMLElement | undefined
	public redoButton: HTMLElement | undefined

	constructor(boardElement: HTMLElement) {
		this.boardElement = boardElement
		this.statusElement = document.getElementById('gameStatus') || undefined
		this.resetButton = document.getElementById('gameReset') || undefined
		this.undoButton = document.getElementById('gameUndo') || undefined
		this.redoButton = document.getElementById('gameRedo') || undefined
	}
}

export { ChessGameConfig }
