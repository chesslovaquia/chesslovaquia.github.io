// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigGameUI } from '../config/ConfigGameUI';

export class GameConfig {
	public ui: ConfigGameUI;

	constructor(board: HTMLElement) {
		this.ui = new ConfigGameUI(board);
	}
}
