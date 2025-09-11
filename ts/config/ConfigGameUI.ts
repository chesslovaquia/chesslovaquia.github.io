// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigError      } from './ConfigError';
import { ConfigGamePlayer } from './ConfigGamePlayer';

export class ConfigGameUI {
	public readonly board: HTMLElement;

	public readonly player1: ConfigGamePlayer;
	public readonly player2: ConfigGamePlayer;

	public readonly description: HTMLElement | null;
	public readonly status:      HTMLElement | null;
	public readonly outcome:     HTMLElement | null;

	public readonly gameReset: HTMLElement | null;

	public readonly navBackward:  HTMLButtonElement | null;
	public readonly navForward:   HTMLButtonElement | null;
	public readonly flipBoard:    HTMLButtonElement | null;
	public readonly navFirstMove: HTMLButtonElement | null;
	public readonly navLastMove:  HTMLButtonElement | null;

	constructor(board: HTMLElement) {
		this.board = board;
		this.player1 = new ConfigGamePlayer("1");
		this.player2 = new ConfigGamePlayer("2");
		this.description = document.getElementById('gameDescription');
		this.status = document.getElementById('gameStatus');
		this.outcome = document.getElementById('gameOutcome');
		this.gameReset = document.getElementById('gameReset');
		this.navBackward = document.getElementById('gameNavBackward') as HTMLButtonElement;
		this.navForward = document.getElementById('gameNavForward') as HTMLButtonElement;
		this.flipBoard = document.getElementById('gameFlipBoard') as HTMLButtonElement;
		this.navFirstMove = document.getElementById('gameNavFirstMove') as HTMLButtonElement;
		this.navLastMove = document.getElementById('gameNavLastMove') as HTMLButtonElement;
		this.validate();
	}

	private validate(): void {
		if (!this.description) {
			throw new ConfigError('ConfigGameUI gameDescription not found.');
		}
		if (!this.status) {
			throw new ConfigError('ConfigGameUI gameStatus not found.');
		}
		if (!this.outcome) {
			throw new ConfigError('ConfigGameUI gameOutcome not found.');
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
		if (!this.navFirstMove) {
			throw new ConfigError('ConfigGameUI navFirstMove not found.');
		}
		if (!this.navLastMove) {
			throw new ConfigError('ConfigGameUI navLastMove not found.');
		}
	}
}
