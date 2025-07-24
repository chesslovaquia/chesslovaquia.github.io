// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class ChessGameConfig {
	public boardElement: HTMLElement;

	public statusBar:   HTMLElement | undefined;
	public resetButton: HTMLElement | undefined;

	constructor(boardElement: HTMLElement) {
		this.boardElement = boardElement;
		this.statusBar    = document.getElementById('gameStatus') || undefined;
		this.resetButton  = document.getElementById('gameReset')  || undefined;
	}
}

export { ChessGameConfig };
