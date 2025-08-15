// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessGameError } from './ChessGameError';

class ChessGameConfig {
	public boardElement: HTMLElement;

	public statusBar:      HTMLElement | undefined;
	public gameReset:      HTMLElement | undefined;
	public gameSetupModal: HTMLElement | null;
	public gameStart:      HTMLElement | null;

	constructor(boardElement: HTMLElement) {
		this.boardElement   = boardElement;
		this.statusBar      = document.getElementById('gameStatus') || undefined;
		this.gameReset      = document.getElementById('gameReset')  || undefined;
		this.gameSetupModal = document.getElementById('gameSetupModal');
		this.gameStart      = document.getElementById('gameStart');
		this.validate();
	}

	private validate(): void {
		if (!this.statusBar) {
			throw new ChessGameError('Config statusBar not found.');
		}
		if (!this.gameReset) {
			throw new ChessGameError('Config gameReset not found.');
		}
		if (!this.gameSetupModal) {
			throw new ChessGameError('Config gameSetupModal not found.');
		}
		if (!this.gameStart) {
			throw new ChessGameError('Config gameStart not found.');
		}
	}
}

export { ChessGameConfig };
