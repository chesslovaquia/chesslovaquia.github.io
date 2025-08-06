// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessGameError } from './ChessGameError';

class ChessGamePlayer {
	private readonly info:  HTMLElement | undefined;
	private readonly clock: HTMLElement | undefined;

	private time: number;

	constructor(id: "1" | "2") {
		this.info  = document.getElementById(`gamePlayer${id}`) || undefined;
		this.clock = document.getElementById(`gameClock${id}`) || undefined;
		if (!this.info) {
			throw new ChessGameError(`gamePlayer${id}: element not found`);
		}
		if (!this.clock) {
			throw new ChessGameError(`gameClock${id}: element not found`);
		}
		this.time = 600;
	}
}

export { ChessGamePlayer };
