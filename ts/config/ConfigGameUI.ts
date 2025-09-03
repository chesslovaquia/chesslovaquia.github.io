// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigError } from './ConfigError';

export class ConfigGameUI {
	public board: HTMLElement;

	public statusBar: HTMLElement | null;
	public gameReset: HTMLElement | null;

	public navBackward: HTMLButtonElement | null;
	public navForward:  HTMLButtonElement | null;
	public flipBoard:   HTMLButtonElement | null;

	constructor(board: HTMLElement) {
		this.board       = board;
		this.statusBar   = document.getElementById('gameStatus');
		this.gameReset   = document.getElementById('gameReset');
		this.navBackward = document.getElementById('gameNavBackward') as HTMLButtonElement;
		this.navForward  = document.getElementById('gameNavForward') as HTMLButtonElement;
		this.flipBoard   = document.getElementById('gameFlipBoard') as HTMLButtonElement;
		this.validate();
	}

	private validate(): void {
		if (!this.statusBar) {
			throw new ConfigError('ConfigGameUI statusBar not found.');
		}
		if (!this.gameReset) {
			throw new ConfigError('ConfigGameUI gameReset not found.');
		}
		if (!this.navBackward) {
			throw new ConfigError('ConfigGameUI navBackward not found.');
		}
		if (!this.navForward) {
			throw new ConfigError('ConfigGameUI navForward not found.');
		}
		if (!this.flipBoard) {
			throw new ConfigError('ConfigGameUI flipBoard not found.');
		}
	}
}
