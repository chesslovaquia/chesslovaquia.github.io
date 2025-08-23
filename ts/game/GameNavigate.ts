// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigGameUI } from '../config/ConfigGameUI';

type NavigateData = Map<number, string>;

export class GameNavigate {
	private readonly ui:   ConfigGameUI;
	private readonly data: NavigateData;

	private index: number;

	constructor(ui: ConfigGameUI) {
		this.ui    = ui;
		this.data  = new Map();
		this.index = 0;
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.ui.navBackward?.addEventListener('click', () => this.navBackward());
		this.ui.navForward?.addEventListener('click', () => this.navForward());
	}

	public async add(fen: string): Promise<void> {
		this.data.set(this.index, fen);
		this.index += 1;
	}

	public navBackward(): void {
		console.debug('Game nav backward.');
	}

	public navForward(): void {
		console.debug('Game nav forward.');
	}
}
