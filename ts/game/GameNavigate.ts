// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigGameUI } from '../config/ConfigGameUI';

type BoardMoves = string[];

export class GameNavigate {
	private readonly ui: ConfigGameUI;

	private data: BoardMoves;

	constructor(ui: ConfigGameUI) {
		this.ui    = ui;
		this.data  = [];
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.ui.navBackward?.addEventListener('click', () => this.navBackward());
		this.ui.navForward?.addEventListener('click', () => this.navForward());
	}

	public async add(fen: string): Promise<void> {
		this.data.push(fen);
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
