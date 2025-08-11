// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess, Move } from 'chess.js';

import { ChessGameConfig } from './ChessGameConfig';
import { ChessGameMove   } from './ChessGameMove';

type Color = 'w' | 'b';

class ChessGameDisplay {
	private readonly game: Chess;
	private readonly move: ChessGameMove;
	private readonly cfg:  ChessGameConfig;

	constructor(cfg: ChessGameConfig, g: Chess, m: ChessGameMove) {
		this.game = g;
		this.move = m;
		this.cfg  = cfg;
	}

	public async updateStatus(): Promise<void> {
		if (!this.cfg.statusBar) {
			console.debug('Game status bar not found.');
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
			}
		}
		this.cfg.statusBar.textContent = statusText;
	}

	public clear(): void {
		if (this.cfg.statusBar) {
			this.cfg.statusBar.textContent = '';
		}
	}

	public clockTimeout(color: Color): void {
		if (this.cfg.statusBar) {
			const player = color === 'w' ? 'White' : 'Black';
			this.cfg.statusBar.textContent = `${player} timeout!`;
		}
	}
}

export { ChessGameDisplay };
