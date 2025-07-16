// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Api as ChessgroundApi } from 'chessground/api';

import * as board from 'chessground/types';
import * as game  from 'chess.js';

import { ChessGameError } from './ChessGameError';
import { ChessGameState } from './ChessGameState';

class ChessGameMove {
	private readonly game:  game.Chess;
	private readonly board: ChessgroundApi;
	private readonly state: ChessGameState;

	constructor(g: game.Chess, b: ChessgroundApi, s: ChessGameState) {
		this.game     = g;
		this.board    = b;
		this.state    = s;
		this.initBoard();
	}

	private initBoard(): void {
		this.board.set({
			turnColor: this.turnColor(),
			movable: {
				color: this.turnColor(),
				dests: this.possibleDests(),
				showDests: true,
			},
		});
	}

	private async saveState(): Promise<void> {
		await this.state.saveMoves(this.game.history());
	}

	private getBoardMove(m: game.Move | undefined): board.Key[] {
		if (m) {
			return [m.from as board.Key, m.to as board.Key];
		}
		return [];
	}

	public updateBoard(lastMove: game.Move | undefined): void {
		this.board.set({
			fen: this.game.fen(),
			turnColor: this.turnColor(),
			movable: {
				color: this.turnColor(),
				dests: this.possibleDests()
			},
			lastMove: this.getBoardMove(lastMove),
		});
		this.saveState();
	}

	public isPromotion(): boolean {
		const lastMove = this.getLastMove();
		if (lastMove) {
			return lastMove.isPromotion();
		}
		return false;
	}

	public possibleDests(): Map<board.Key, board.Key[]> {
		const dests = new Map<board.Key, board.Key[]>();
		game.SQUARES.forEach((square: game.Square) => {
			const moves = this.game.moves({ square, verbose: true }) as game.Move[];
			if (moves.length > 0) {
				dests.set(square as board.Key, moves.map((move: game.Move) => move.to as board.Key));
			}
		})
		return dests;
	}

	public turnColor(): board.Color {
		return this.game.turn() === 'w' ? 'white' : 'black';
	}

	public exec(orig: board.Key, dest: board.Key, promotion: string): void {
		try {
			const move = this.game.move({
				from: orig as game.Square,
				to: dest as game.Square,
				promotion: promotion,
			});
			if (move) {
				console.log('Move:', move.san);
				this.updateBoard(move);
			} else {
				// Invalid move - reset position
				console.error('Invalid move, reset position:', move);
				this.board.set({ fen: this.game.fen() });
			}
		} catch (error) {
			console.error('Invalid move:', error);
			// Reset board to current position
			this.board.set({ fen: this.game.fen() });
		}
	}

	public undo(): boolean {
		if (this.game.undo()) {
			this.updateBoard(this.getLastMove());
			return true;
		}
		console.log('No move to undo!');
		return false;
	}

	public reset(): void {
	}

	public getLastMove(): game.Move | undefined {
		const lastMove = this.game.history({ verbose : true }).pop();
		return lastMove;
	}

	public loadMoves(moves: string[]): void {
		this.reset();
		this.game.reset();
		let gotError = '';
		moves.every(san => {
			console.debug('Game load move:', san);
			const move = this.game.move(san, { strict: true });
			if (move) {
				return true;
			} else {
				gotError = san;
				return false;
			}
		})
		if (gotError !== '') {
			throw new ChessGameError(`Invalid move: ${gotError}`);
		}
	}

}

export { ChessGameMove };
