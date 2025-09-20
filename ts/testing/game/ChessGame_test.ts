// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, beforeEach, describe } from 'vitest';

import { mockConfigGameUI } from '../testing';
import { mockGameDeps     } from '../testing';

import { ChessGame } from '../../game/ChessGame';

function newTestGame(): ChessGame {
	return new ChessGame(mockGameDeps());
}

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
});

describe('ChessGame', () => {
	test('init', () => {
		const game = newTestGame();
		game.init();
	});
});
