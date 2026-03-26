// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine } from '../engine/GameEngine';

import { toBoard } from '../engine/ColorUtils';

import { logger } from '../clvq/Logger';

import { GameBoard           } from '../board/GameBoard';
import { BoardSquare         } from '../board/GameBoard';
import { BoardPromotionPiece } from '../board/GameBoard';
import { BoardColor          } from '../board/GameBoard';

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
				logger.debug('Move:', move);
				this.board.update();
			} else {
				// Invalid move - reset position
				logger.error('Invalid move, reset position.');
				this.board.reset();
			}
		} catch (error) {
			logger.error('Invalid move:', error);
			// Reset board to current position
			this.board.reset();
		}
	}

	public undo(): boolean {
		if (this.engine.undo()) {
			this.board.update();
			return true;
		}
		logger.debug('No move to undo!');
		return false;
	}

	public turnColor(): BoardColor {
		return toBoard(this.engine.turn());
	}
}
