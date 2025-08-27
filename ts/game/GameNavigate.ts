// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigGameUI } from '../config/ConfigGameUI';

import { ChessBoard } from '../board/ChessBoard';

type BoardMoves = string[];

export class GameNavigate {
	private readonly ui:    ConfigGameUI;
	private readonly board: ChessBoard;

	private data: BoardMoves;

	constructor(ui: ConfigGameUI, board: ChessBoard) {
		this.ui    = ui;
		this.board = board;
		this.data  = [];
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.ui.navBackward?.addEventListener('click', () => this.navBackward());
		this.ui.navForward?.addEventListener('click', () => this.navForward());
	}

	public addPosition(): void {
		this.data.push(this.board.getFen());
	}

	public navBackward(): void {
		console.debug('Game nav backward.');
	}

	public navForward(): void {
		console.debug('Game nav forward.');
	}

	public getState(): BoardMoves {
		return this.data;
	}

	public setState(data: BoardMoves): void {
		this.data = data;
	}
}
