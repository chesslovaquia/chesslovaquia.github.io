// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';

import * as chess  from 'chess.js';

import * as cg from 'chessground/types';

import { ChessBoard } from '../board/ChessBoard';

import { BoardSquare         } from '../board/GameBoard';
import { BoardPromotionPiece } from '../board/GameBoard';

export class GameMove {
	private readonly game:  Chess;
	private readonly board: ChessBoard;

	constructor(g: Chess, b: ChessBoard) {
		this.game  = g;
		this.board = b;
	}

	public exec(orig: BoardSquare, dest: BoardSquare, promotion: BoardPromotionPiece): void {
		try {
			const move = this.game.move({
				from: orig,
				to: dest,
				promotion: promotion,
			});
			if (move) {
				console.log('Move:', move.san);
				this.board.update();
			} else {
				// Invalid move - reset position
				console.error('Invalid move, reset position:', move);
				this.board.reset();
			}
		} catch (error) {
			console.error('Invalid move:', error);
			// Reset board to current position
			this.board.reset();
		}
	}

	public undo(): boolean {
		if (this.game.undo()) {
			this.board.update();
			return true;
		}
		console.log('No move to undo!');
		return false;
	}

	public turnColor(): cg.Color {
		return this.game.turn() === 'w' ? 'white' : 'black';
	}
}
