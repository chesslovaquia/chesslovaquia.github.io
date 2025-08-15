// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessGameError } from './ChessGameError';

class ConfigUI {
	public board: HTMLElement;

	public statusBar:      HTMLElement | undefined;
	public gameReset:      HTMLElement | undefined;
	public gameSetupModal: HTMLElement | null;
	public gameStart:      HTMLElement | null;

	constructor(board: HTMLElement) {
		this.board   = board;
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

class ChessGameConfig {
	public ui: ConfigUI;

	constructor(board: HTMLElement) {
		this.ui = new ConfigUI(board);
	}
}

export { ChessGameConfig };
