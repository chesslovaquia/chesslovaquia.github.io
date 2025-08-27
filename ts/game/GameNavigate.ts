// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigGameUI } from '../config/ConfigGameUI';

import { ChessBoard } from '../board/ChessBoard';

type BoardMoves = string[];

type NavState = {
	moves:    BoardMoves,
	position: number,
}

export class GameNavigate {
	private readonly ui:    ConfigGameUI;
	private readonly board: ChessBoard;

	private pos:   BoardMoves;
	private index: number;

	constructor(ui: ConfigGameUI, board: ChessBoard) {
		this.ui    = ui;
		this.board = board;
		this.pos   = [];
		this.index = -1;
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.ui.navBackward?.addEventListener('click', () => this.navBackward());
		this.ui.navForward?.addEventListener('click', () => this.navForward());
	}

	private disableButton(button: HTMLButtonElement): void {
		if (button) {
			button.disabled = true;
		}
	}

	private enableButton(button: HTMLButtonElement | null): void {
		if (button) {
			button.disabled = false;
		}
	}

	public addPosition(): void {
		this.pos.push(this.board.getFen());
		this.index++;
		if (this.index === 1) {
			this.enableButton(this.ui.navBackward);
		}
	}

	public navBackward(): void {
		console.debug('Game nav backward.');
	}

	public navForward(): void {
		console.debug('Game nav forward.');
	}

	public getState(): NavState {
		return {
			moves:    this.pos,
			position: this.index,
		};
	}

	public setState(state: NavState): void {
		if (state.moves) {
			this.pos   = state.moves;
			this.index = state.position;
			if (this.index >= 1) {
				this.enableButton(this.ui.navBackward);
			}
		}
	}
}
