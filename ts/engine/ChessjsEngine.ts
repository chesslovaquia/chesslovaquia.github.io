// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess }  from 'chess.js';
import * as chess from 'chess.js';

import { BoardDests  } from '../board/GameBoard';
import { BoardSquare } from '../board/GameBoard';
import { BoardMove   } from '../board/GameBoard';

import { EngineColor } from './GameEngine';

export class ChessjsEngine {
	private readonly game: Chess;

	constructor() {
		this.game = new Chess(chess.DEFAULT_POSITION);
	}

	private getLastMove(): chess.Move | undefined {
		return this.game.history({verbose: true}).pop();
	}

	public turn(): EngineColor {
		return this.game.turn();
	}

	public reset(): void {
		this.game.reset();
	}

	public fen(): string {
		return this.game.fen();
	}

	public inCheck(): boolean {
		return this.game.inCheck();
	}

	public possibleDests(): BoardDests {
		const dests = new Map<BoardSquare, BoardSquare[]>();
		chess.SQUARES.forEach((square: chess.Square) => {
			const moves = this.game.moves({ square, verbose: true }) as chess.Move[];
			if (moves.length > 0) {
				dests.set(square as BoardSquare, moves.map((move: chess.Move) => move.to as BoardSquare));
			}
		});
		return dests;
	}

	public lastMove(): BoardMove | undefined {
		const m = this.getLastMove();
		if (m) {
			return {from: m.from, to: m.to};
		}
		return undefined;
	}

	public isPromotion(): boolean {
		const m = this.getLastMove();
		if (m) {
			return m.isPromotion();
		}
		return false;
	}

	public history(): string[] {
		return this.game.history();
	}

	public move(san: string): BoardMove | null {
		return this.game.move(san, {strict: true});
	}
}
