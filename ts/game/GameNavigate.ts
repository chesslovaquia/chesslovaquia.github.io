// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess }  from 'chess.js';
import * as chess from 'chess.js';

import { ConfigGameUI } from '../config/ConfigGameUI';

import { ChessBoard } from '../board/ChessBoard';

type BoardMoves = string[];

type NavState = {
	pos:   BoardMoves,
	index: number,
	moves: chess.Move[],
}

export class GameNavigate {
	private readonly ui:    ConfigGameUI;
	private readonly board: ChessBoard;
	private readonly game:  Chess;

	private pos:   BoardMoves;
	private index: number;
	private moves: chess.Move[];

	constructor(ui: ConfigGameUI, board: ChessBoard, game: Chess) {
		this.ui    = ui;
		this.board = board;
		this.game  = game;
		this.pos   = [];
		this.index = -1;
		this.moves = [];
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.ui.navBackward?.addEventListener('click', () => this.navBackward());
		this.ui.navForward?.addEventListener('click', () => this.navForward());
	}

	private disableButton(button: HTMLButtonElement | null): void {
		if (button) {
			button.disabled = true;
		}
	}

	private enableButton(button: HTMLButtonElement | null): void {
		if (button) {
			button.disabled = false;
		}
	}

	private getLastMove(): chess.Move | undefined {
		return this.game.history({verbose: true}).pop();
	}

	public addPosition(): void {
		const lastMove = this.getLastMove();
		if (lastMove) {
			this.moves.push(lastMove);
		}
		this.pos.push(this.board.getFen());
		this.index++;
		if (this.index === 1) {
			this.enableButton(this.ui.navBackward);
		}
	}

	public navBackward(): void {
		console.debug('Game nav backward.');
		if (this.index === this.pos.length - 1) {
			this.enableButton(this.ui.navForward);
			this.board.disable();
		}
		this.index--;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
		if (this.index === 0) {
			this.disableButton(this.ui.navBackward);
		}
	}

	public navForward(): void {
		console.debug('Game nav forward.');
		this.index++;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
		if (this.index === this.pos.length - 1) {
			this.disableButton(this.ui.navForward);
			this.board.enable();
		}
		if (this.index === 1) {
			this.enableButton(this.ui.navBackward);
		}
	}

	public getState(): NavState {
		return {
			pos:   this.pos,
			index: this.index,
			moves: this.moves,
		};
	}

	public setState(state: NavState): void {
		if (state.pos) {
			this.pos   = state.pos;
			this.index = state.index;
			this.moves = state.moves;
			if (this.index >= 1) {
				this.enableButton(this.ui.navBackward);
			}
		}
	}
}
