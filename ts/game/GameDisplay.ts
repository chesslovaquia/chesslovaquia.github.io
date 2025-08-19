// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess, Move } from 'chess.js';

import { GameConfig } from './GameConfig';
import { GameMove   } from './GameMove';

import { Color } from './types';

export class GameDisplay {
	private readonly game: Chess;
	private readonly move: GameMove;
	private readonly cfg:  GameConfig;

	constructor(cfg: GameConfig, g: Chess, m: GameMove) {
		this.game = g;
		this.move = m;
		this.cfg  = cfg;
	}

	public async updateStatus(): Promise<void> {
		if (!this.cfg.ui.statusBar) {
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
		this.cfg.ui.statusBar.textContent = statusText;
	}

	public clear(): void {
		if (this.cfg.ui.statusBar) {
			this.cfg.ui.statusBar.textContent = '';
		}
	}

	public reset(): void {
		this.cfg.ui.board.classList.toggle('timeout', false);
	}

	public clockTimeout(color: Color): void {
		if (this.cfg.ui.statusBar) {
			const player = color === 'w' ? 'White' : 'Black';
			this.cfg.ui.statusBar.textContent = `${player} timeout!`;
		}
		this.cfg.ui.board.classList.toggle('timeout', true);
	}
}
