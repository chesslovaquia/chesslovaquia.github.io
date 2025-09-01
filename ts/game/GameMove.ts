// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import * as cg from 'chessground/types';

import { GameEngine } from '../engine/GameEngine';

import { GameBoard } from '../board/GameBoard';

import { BoardSquare         } from '../board/GameBoard';
import { BoardPromotionPiece } from '../board/GameBoard';

export class GameMove {
	private readonly engine: GameEngine;
	private readonly board:  GameBoard;

	constructor(engine: GameEngine, board: GameBoard) {
		this.engine = engine;
		this.board = board;
	}

	public exec(orig: BoardSquare, dest: BoardSquare, promotion: BoardPromotionPiece): void {
		try {
			const move = this.engine.move({
				from: orig,
				to: dest,
				promotion: promotion,
			});
			if (move) {
				console.log('Move:', move);
				this.board.update();
			} else {
				// Invalid move - reset position
				console.error('Invalid move, reset position.');
				this.board.reset();
			}
		} catch (error) {
			console.error('Invalid move:', error);
			// Reset board to current position
			this.board.reset();
		}
	}

	public undo(): boolean {
		if (this.engine.undo()) {
			this.board.update();
			return true;
		}
		console.log('No move to undo!');
		return false;
	}

	public turnColor(): cg.Color {
		return this.engine.turn() === 'w' ? 'white' : 'black';
	}
}
