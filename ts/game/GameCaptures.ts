// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { EngineColor } from '../engine/GameEngine';

import { BoardPiece } from '../board/GameBoard';

import { ConfigGameUI     } from '../config/ConfigGameUI';
import { ConfigGamePlayer } from '../config/ConfigGamePlayer';

export class GameCaptures {
	private readonly p1: ConfigGamePlayer;
	private readonly p2: ConfigGamePlayer;

	private side: Record<EngineColor, ConfigGamePlayer>;

	constructor(ui: ConfigGameUI) {
		this.p1 = ui.player1;
		this.p2 = ui.player2;
		this.side = {'w': this.p1, 'b': this.p2};
	}

	public add(side: EngineColor, piece: BoardPiece): void {
	}
}
