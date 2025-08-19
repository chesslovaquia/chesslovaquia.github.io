// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';

import * as chess  from 'chess.js';

import * as cg from 'chessground/types';

import { ChessBoard } from '../board/ChessBoard';

export class GameMove {
	private readonly game:  Chess;
	private readonly board: ChessBoard;

	constructor(g: Chess, b: ChessBoard) {
		this.game  = g;
		this.board = b;
	}

	public isPromotion(): boolean {
		const lastMove = this.getLastMove();
		if (lastMove) {
			return lastMove.isPromotion();
		}
		return false;
	}

	public exec(orig: cg.Key, dest: cg.Key, promotion: string): void {
		try {
			const move = this.game.move({
				from: orig as chess.Square,
				to: dest as chess.Square,
				promotion: promotion,
			});
			if (move) {
				console.log('Move:', move.san);
				this.board.update(move);
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
			this.board.update(this.getLastMove());
			return true;
		}
		console.log('No move to undo!');
		return false;
	}

	public getLastMove(): chess.Move | undefined {
		const lastMove = this.game.history({verbose : true}).pop();
		return lastMove;
	}

	public turnColor(): cg.Color {
		return this.game.turn() === 'w' ? 'white' : 'black';
	}
}
