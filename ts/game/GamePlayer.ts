// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameError } from './GameError';

export class GamePlayer {
	public readonly info:  HTMLElement | undefined;
	public readonly clock: HTMLElement | undefined;

	constructor(id: "1" | "2") {
		this.info  = document.getElementById(`gamePlayer${id}`) || undefined;
		this.clock = document.getElementById(`gameClock${id}`) || undefined;
		if (!this.info) {
			throw new GameError(`gamePlayer${id}: element not found`);
		}
		if (!this.clock) {
			throw new GameError(`gameClock${id}: element not found`);
		}
	}
}
