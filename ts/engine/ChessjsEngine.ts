// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess }  from 'chess.js';
import * as chess from 'chess.js';

import { EngineColor } from './GameEngine';

export class ChessjsEngine {
	private readonly game: Chess;

	constructor() {
		this.game = new Chess(chess.DEFAULT_POSITION);
	}

	public turn(): EngineColor {
		return this.game.turn() as EngineColor;
	}

	public reset(): void {
		this.game.reset();
	}
}
