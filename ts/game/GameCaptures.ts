// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';

import { BoardPiece } from '../board/GameBoard';

import { ConfigGameUI     } from '../config/ConfigGameUI';
import { ConfigGamePlayer } from '../config/ConfigGamePlayer';

type CapturedPiece = BoardPiece | '';

const pieceValue = new Map<BoardPiece, number>([
	['p', 1],
	['b', 3],
	['n', 3],
	['r', 5],
	['q', 9],
]);

export type CapturesState = {
	captures: Record<EngineColor, CapturedPiece[]>,
	count: Record<EngineColor, number[]>,
}

export class GameCaptures {
	private readonly engine: GameEngine;
	private readonly p1: ConfigGamePlayer;
	private readonly p2: ConfigGamePlayer;

	private side: Record<EngineColor, ConfigGamePlayer>;
	private captures: Record<EngineColor, CapturedPiece[]>;
	private count: Record<EngineColor, number[]>;

	constructor(ui: ConfigGameUI, engine: GameEngine) {
		this.engine = engine;
		this.p1 = ui.player1;
		this.p2 = ui.player2;
		this.side = {'w': this.p1, 'b': this.p2};
		this.captures = {'w': [], 'b': []};
		this.count = {'w': [], 'b': []};
	}

	public addPosition(): void {
		console.debug('Game captures add position.');
		const capture = this.engine.capturedPiece();
		if (capture) {
			const turn = this.engine.turn();
			const side = turn === 'w' ? 'b' : 'w';
			console.debug('Game capture:', side, capture);
			this.captures[turn].push('');
			this.captures[side].push(capture);
			this.addCount(turn, side, capture);
			this.updateMaterial(side, capture);
		}
	}

	private addCount(turn: EngineColor, side: EngineColor, capture: BoardPiece): void {
		const value = pieceValue[capture];
		if (this.count[side].length > 0) {
			const idx = this.count[side].length - 1;
			this.count[turn].push(this.count[turn][idx]);
			const current = this.count[side][idx];
			this.count[side].push(current + value);
		} else {
			this.count[turn].push(0);
			this.count[side].push(value);
		}
	}

	private async updateMaterial(side: EngineColor, piece: BoardPiece): Promise<void> {
		if (this.side[side].material) {
			this.side[side].material.textContent += piece;
		}
	}

	public getState(): CapturesState {
		return {
			captures: this.captures,
			count: this.count,
		}
	}

	public setState(state: CapturesState): void {
		this.captures = state.captures;
		this.count = state.count;
	}
}
