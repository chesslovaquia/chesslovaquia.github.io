// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { EngineColor } from '../engine/GameEngine';

import { GamePlayer } from './GamePlayer';

export class GameCaptures {
	private readonly p1: GamePlayer;
	private readonly p2: GamePlayer;

	private side: Record<EngineColor, GamePlayer>;

	constructor(p1: GamePlayer, p2: GamePlayer) {
		this.p1 = p1;
		this.p2 = p2;
		this.side = {'w': this.p1, 'b': this.p2};
	}
}
