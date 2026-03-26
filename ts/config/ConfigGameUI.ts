// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { requireElement   } from './ConfigError';
import { ConfigGamePlayer } from './ConfigGamePlayer';

import { ElementIds } from '../clvq/ElementIds';

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
		this.player1 = new ConfigGamePlayer('1');
		this.player2 = new ConfigGamePlayer('2');
		this.description = document.getElementById(ElementIds.gameDescription);
		this.status = document.getElementById(ElementIds.gameStatus);
		this.outcome = document.getElementById(ElementIds.gameOutcome);
		this.gameReset = document.getElementById(ElementIds.gameReset);
		this.navBackward = document.getElementById(ElementIds.gameNavBackward) as HTMLButtonElement;
		this.navForward = document.getElementById(ElementIds.gameNavForward) as HTMLButtonElement;
		this.flipBoard = document.getElementById(ElementIds.gameFlipBoard) as HTMLButtonElement;
		this.navFirstMove = document.getElementById(ElementIds.gameNavFirstMove) as HTMLButtonElement;
		this.navLastMove = document.getElementById(ElementIds.gameNavLastMove) as HTMLButtonElement;
		this.validate();
	}

	private validate(): void {
		requireElement(this.description,  'ConfigGameUI gameDescription');
		requireElement(this.status,       'ConfigGameUI gameStatus');
		requireElement(this.outcome,      'ConfigGameUI gameOutcome');
		requireElement(this.gameReset,    'ConfigGameUI gameReset');
		requireElement(this.navBackward,  'ConfigGameUI navBackward');
		requireElement(this.navForward,   'ConfigGameUI navForward');
		requireElement(this.flipBoard,    'ConfigGameUI flipBoard');
		requireElement(this.navFirstMove, 'ConfigGameUI navFirstMove');
		requireElement(this.navLastMove,  'ConfigGameUI navLastMove');
	}
}
