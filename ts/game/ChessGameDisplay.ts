// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess, Move } from 'chess.js';

import { ChessGameConfig } from './ChessGameConfig';
import { ChessGameMove }   from './ChessGameMove';

class ChessGameDisplay {
	private readonly game: Chess;
	private readonly move: ChessGameMove;

	private statusElement: HTMLElement | undefined;

	constructor(cfg: ChessGameConfig, g: Chess, m: ChessGameMove) {
		this.game          = g;
		this.move          = m;
		this.statusElement = cfg.statusElement;
	}

	public updateStatus(): void {
		if (!this.statusElement) {
			return;
		}
		let statusText = '';
		if (this.game.isGameOver()) {
			if (this.game.isCheckmate()) {
				const winner = this.game.turn() === 'w' ? 'Black' : 'White';
				statusText = `Checkmate! ${winner} wins.`;
			} else if (this.game.isDraw()) {
				statusText = 'Draw!';
			} else if (this.game.isStalemate()) {
				statusText = 'Stalemate!';
			} else if (this.game.isThreefoldRepetition()) {
				statusText = 'Draw by threefold repetition!';
			} else if (this.game.isInsufficientMaterial()) {
				statusText = 'Draw by insufficient material!';
			}
		} else {
			const currentPlayer = this.game.turn() === 'w' ? 'White' : 'Black';
			statusText = `${currentPlayer} to move`;
			if (this.game.inCheck()) {
				statusText += ' (in check)';
			} else {
				if (this.move.isPromotion()) {
					statusText += ' (pawn promotion)';
				}
			}
		}
		this.statusElement.textContent = statusText;
	}

	public clear(): void {
		if (this.statusElement) {
			this.statusElement.textContent = '';
		}
	}
}

export { ChessGameDisplay };
