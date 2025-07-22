// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess, Move } from 'chess.js';

import { ChessGameConfig } from './ChessGameConfig';
import { ChessGameMove   } from './ChessGameMove';

import { toggleScreen } from './screen';

class ChessGameDisplay {
	private readonly game: Chess;
	private readonly move: ChessGameMove;
	private readonly cfg:  ChessGameConfig;

	private curScreen: string;

	constructor(cfg: ChessGameConfig, g: Chess, m: ChessGameMove) {
		this.game = g;
		this.move = m;
		this.cfg  = cfg;
		this.curScreen = 'mobile';
	}

	public updateStatus(): void {
		if (!this.cfg.statusLaptop || !this.cfg.statusMobile) {
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
		this.cfg.statusLaptop.textContent = statusText;
		this.cfg.statusMobile.textContent = statusText;
	}

	public clear(): void {
		if (this.cfg.statusLaptop) {
			this.cfg.statusLaptop.textContent = '';
		}
		if (this.cfg.statusMobile) {
			this.cfg.statusMobile.textContent = '';
		}
	}

	public toggleBoardScreen(): void {
		if (window.innerWidth < 768) {
			if (this.curScreen !== 'mobile') {
				toggleScreen('mobile');
				this.curScreen = 'mobile';
			}
		} else {
			if (this.curScreen !== 'laptop') {
				toggleScreen('laptop');
				this.curScreen = 'laptop';
			}
		}
	}
}

export { ChessGameDisplay };
