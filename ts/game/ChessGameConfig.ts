// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class ChessGameConfig {
	public boardElement: HTMLElement;

	public statusLaptop: HTMLElement | undefined;
	public statusMobile: HTMLElement | undefined;

	public resetButtonLaptop: HTMLElement | undefined;
	public resetButtonMobile: HTMLElement | undefined;

	constructor(boardElement: HTMLElement) {
		this.boardElement  = boardElement;
		// Game status.
		this.statusLaptop = document.getElementById('gameStatusLaptop') || undefined;
		this.statusMobile = document.getElementById('gameStatusMobile') || undefined;
		// Reset buttons.
		this.resetButtonLaptop = document.getElementById('gameResetLaptop')  || undefined;
		this.resetButtonMobile = document.getElementById('gameResetMobile')  || undefined;
	}
}

export { ChessGameConfig };
