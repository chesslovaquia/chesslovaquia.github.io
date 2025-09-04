// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess }  from 'chess.js';
import * as chess from 'chess.js';

import { BoardDests  } from '../board/GameBoard';
import { BoardSquare } from '../board/GameBoard';
import { BoardMove   } from '../board/GameBoard';
import { BoardColor  } from '../board/GameBoard';

import { EngineError } from './EngineError';

import { EngineMove  } from './GameEngine';
import { EngineColor } from './GameEngine';
import { MovesSAN    } from './GameEngine';

export class ChessjsEngine {
	private readonly game: Chess;

	constructor() {
		this.game = new Chess(chess.DEFAULT_POSITION);
	}

	private getLastMove(): chess.Move | undefined {
		return this.game.history({verbose: true}).pop();
	}

	private inCheck(): boolean {
		return this.game.inCheck();
	}

	private turnColor(): BoardColor {
		if (this.game.turn() === 'w') {
			return 'white';
		} else {
			return 'black';
		}
	}

	private boardMove(from: BoardSquare, to: BoardSquare): BoardMove {
		return {
			from:      from,
			to:        to,
			inCheck:   this.inCheck(),
			turnColor: this.turnColor(),
		};
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
			return this.boardMove(m.from, m.to);
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

	public move(m: EngineMove): BoardMove | undefined {
		const move = this.game.move({
			from:      m.from      as chess.Square,
			to:        m.to        as chess.Square,
			promotion: m.promotion as chess.PieceSymbol,
		});
		if (move) {
			return this.boardMove(move.from, move.to);
		}
		return undefined;
	}

	public undo(): BoardMove | undefined {
		const move = this.game.undo();
		if (move) {
			return this.boardMove(move.from, move.to);
		}
		return undefined;
	}

	public isGameOver(): boolean {
		return this.game.isGameOver();
	}

	public isCheckmate(): boolean {
		return this.game.isCheckmate();
	}

	public isDraw(): boolean {
		return this.game.isDraw();
	}

	public isStalemate(): boolean {
		return this.game.isStalemate();
	}

	public isThreefoldRepetition(): boolean {
		return this.game.isThreefoldRepetition();
	}

	public isInsufficientMaterial(): boolean {
		return this.game.isInsufficientMaterial();
	}

	public getState(): MovesSAN {
		return this.game.history();
	}

	public setState(moves: MovesSAN): void {
		console.debug('Engine load moves:', moves);
		this.game.reset();
		let gotError = '';
		moves.every(san => {
			const move = this.game.move(san);
			if (move) {
				return true;
			} else {
				gotError = san;
				return false;
			}
		});
		if (gotError !== '') {
			throw new EngineError(`Invalid move: ${gotError}`);
		}
	}
}
