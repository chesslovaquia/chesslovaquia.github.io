// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessGameError  } from './ChessGameError';

export function toggleScreen(mode: string) {

	console.debug('Toggle screen:', mode);

	const cgWrap       = document.getElementById('chessboard');
	const mobileScreen = document.getElementById('chessBoardMobile');
	const laptopScreen = document.getElementById('chessBoardLaptop');

	const toggleBoard = (parent: HTMLElement | null) => {
		if (parent) {
			setTimeout(() => {
				parent.appendChild(cgWrap as Node);
			}, 0);
		}
	}

	if (cgWrap && mobileScreen && laptopScreen) {
		if (mode === 'mobile') {
			toggleBoard(mobileScreen);
		} else {
			toggleBoard(laptopScreen);
		}
	} else {
		const msg = `Toggle screen divs not found: cg-wrap=${cgWrap} mobile=${mobileScreen} laptop=${laptopScreen}`;
		throw new ChessGameError(msg);
	}

}
