// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class ChessGameConfig {
	public boardElement:  HTMLElement
	public statusElement: HTMLElement | undefined
	public resetButton:   HTMLElement | undefined
	public undoButton:    HTMLElement | undefined
	public redoButton:    HTMLElement | undefined

	public mobileScreen: HTMLElement | undefined
	public laptopScreen: HTMLElement | undefined
	public cgWrap:           Element | undefined

	constructor(boardElement: HTMLElement) {
		this.boardElement  = boardElement
		this.statusElement = document.getElementById('gameStatus') || undefined
		this.resetButton   = document.getElementById('gameReset')  || undefined
		this.undoButton    = document.getElementById('gameUndo')   || undefined
		this.redoButton    = document.getElementById('gameRedo')   || undefined

		this.mobileScreen = document.getElementById('chessBoardMobile') || undefined
		this.laptopScreen = document.getElementById('chessBoardLaptop') || undefined
		this.cgWrap       = document.querySelector('.cg-wrap')          || undefined
	}
}

export { ChessGameConfig }
