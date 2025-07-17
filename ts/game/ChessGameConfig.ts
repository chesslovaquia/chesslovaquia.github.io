// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class ChessGameConfig {
	public boardElement: HTMLElement

	public statusElement: HTMLElement | undefined

	public resetButtonLaptop: HTMLElement | undefined
	public resetButtonMobile: HTMLElement | undefined

	public mobileScreen: HTMLElement | undefined
	public laptopScreen: HTMLElement | undefined

	constructor(boardElement: HTMLElement) {
		this.boardElement  = boardElement
		this.statusElement = document.getElementById('gameStatus') || undefined

		this.resetButtonLaptop = document.getElementById('gameResetLaptop')  || undefined
		this.resetButtonMobile = document.getElementById('gameResetMobile')  || undefined
	}
}

export { ChessGameConfig }
