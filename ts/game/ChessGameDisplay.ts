// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess, Move } from 'chess.js';

import { ChessGameConfig } from './ChessGameConfig';
import { ChessGameError  } from './ChessGameError';
import { ChessGameMove   } from './ChessGameMove';

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
			}
		}
		this.statusElement.textContent = statusText;
	}

	public clear(): void {
		if (this.statusElement) {
			this.statusElement.textContent = '';
		}
	}

	public toggleBoardScreen(): void {
		const cgWrap       = document.getElementById('chessboard');
		const mobileScreen = document.getElementById('chessBoardMobile');
		const laptopScreen = document.getElementById('chessBoardLaptop');
		if (cgWrap && mobileScreen && laptopScreen) {
			if (window.innerWidth < 768) {
				setTimeout(() => {
					console.debug('Toggle board screen: mobile');
					mobileScreen?.appendChild(cgWrap as Node);
				}, 0);
			} else {
				setTimeout(() => {
					console.debug('Toggle board screen: laptop');
					laptopScreen?.appendChild(cgWrap as Node);
				}, 0);
			}
		} else {
			const msg = `Toggle screen divs not found: cg-wrap=${cgWrap} mobile=${mobileScreen} laptop=${laptopScreen}`;
			throw new ChessGameError(msg);
		}
	}
}

export { ChessGameDisplay };
