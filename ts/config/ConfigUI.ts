// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigError } from './ConfigError';

export class ConfigUI {
	public board: HTMLElement;

	public statusBar:      HTMLElement | null;
	public gameReset:      HTMLElement | null;

	constructor(board: HTMLElement) {
		this.board          = board;
		this.statusBar      = document.getElementById('gameStatus');
		this.gameReset      = document.getElementById('gameReset');
		this.validate();
	}

	private validate(): void {
		if (!this.statusBar) {
			throw new ConfigError('ConfigUI statusBar not found.');
		}
		if (!this.gameReset) {
			throw new ConfigError('ConfigUI gameReset not found.');
		}
	}
}
