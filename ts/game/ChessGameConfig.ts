// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class ChessGameConfig {
	public boardElement: HTMLElement

	public statusElement: HTMLElement | undefined
	public resetButton:   HTMLElement | undefined
	public undoButton:    HTMLElement | undefined
	public redoButton:    HTMLElement | undefined

	public mobileScreen: HTMLElement | undefined
	public laptopScreen: HTMLElement | undefined

	constructor(boardElement: HTMLElement) {
		this.boardElement = boardElement

		this.statusElement = document.getElementById('gameStatus') || undefined
		this.resetButton   = document.getElementById('gameReset')  || undefined
	}
}

export { ChessGameConfig }
