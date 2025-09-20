// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, beforeEach, describe } from 'vitest';

import { mockConfigGameUI } from '../testing';

import { gameDeps  } from '../../game/game';
import { ChessGame } from '../../game/ChessGame';

const boardUI = document.createElement('div');

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
});

describe('ChessGame', () => {
	test('init', () => {
		const game = new ChessGame(gameDeps(boardUI));
		game.init();
	});
});
