// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigUI } from '../config/ConfigUI';

export class GameConfig {
	public ui: ConfigUI;

	constructor(board: HTMLElement) {
		this.ui = new ConfigUI(board);
	}
}
