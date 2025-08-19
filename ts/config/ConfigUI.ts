// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigError } from './ConfigError';

export class ConfigUI {
	public board: HTMLElement;

	public statusBar:      HTMLElement | null;
	public gameReset:      HTMLElement | null;
	public gameSetupModal: HTMLElement | null;
	public gameStart:      HTMLElement | null;

	constructor(board: HTMLElement) {
		this.board          = board;
		this.statusBar      = document.getElementById('gameStatus');
		this.gameReset      = document.getElementById('gameReset');
		this.gameSetupModal = document.getElementById('gameSetupModal');
		this.gameStart      = document.getElementById('gameStart');
		this.validate();
	}

	private validate(): void {
		if (!this.statusBar) {
			throw new ConfigError('ConfigUI statusBar not found.');
		}
		if (!this.gameReset) {
			throw new ConfigError('ConfigUI gameReset not found.');
		}
		if (!this.gameSetupModal) {
			throw new ConfigError('ConfigUI gameSetupModal not found.');
		}
		if (!this.gameStart) {
			throw new ConfigError('ConfigUI gameStart not found.');
		}
	}
}
