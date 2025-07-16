// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessGame }       from './ChessGame';
import { ChessGameConfig } from './ChessGameConfig';
import { ChessGameError }  from './ChessGameError';

function toggleBoardScreen(): void {
	console.debug('Toggle board screen.');
	const mobileScreen = document.getElementById('chessBoardMobile');
	const laptopScreen = document.getElementById('chessBoardLaptop');
	const chessBoard = document.querySelector('.cg-wrap');
	if (chessBoard && mobileScreen && laptopScreen) {
		if (window.innerWidth < 768) {
			setTimeout(() => {
				mobileScreen.appendChild(chessBoard);
			}, 7);
		} else {
			setTimeout(() => {
				laptopScreen.appendChild(chessBoard);
			}, 7);
		}
	} else {
		throw new ChessGameError(`Chess board not found: ${chessBoard}`);
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const board = document.getElementById('chessboard');
	const mobileScreen = document.getElementById('chessBoardMobile');
	const laptopScreen = document.getElementById('chessBoardLaptop');
	if (board && mobileScreen && laptopScreen) {
		const cfg = new ChessGameConfig(board);
		const game = new ChessGame(cfg);
		window.addEventListener('resize', toggleBoardScreen);
		window.addEventListener('load', toggleBoardScreen);
	} else {
		const msg = `Screen divs not found: board=${board} mobile=${mobileScreen} laptop=${laptopScreen}`;
		throw new ChessGameError(msg);
	}
});
