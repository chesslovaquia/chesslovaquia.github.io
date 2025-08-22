// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigGameUI } from '../config/ConfigGameUI';

export class GameNavigate {
	private readonly ui: ConfigGameUI;

	constructor(ui: ConfigGameUI) {
		this.ui = ui;
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.ui.navBackward?.addEventListener('click', () => this.navBackward());
		this.ui.navForward?.addEventListener('click', () => this.navForward());
	}

	public navBackward(): void {
		console.debug('Game nav backward.');
	}

	public navForward(): void {
		console.debug('Game nav forward.');
	}
}
