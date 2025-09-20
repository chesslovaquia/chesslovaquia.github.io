// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, beforeEach, describe } from 'vitest';

import { mockConfigGameUI } from '../testing';
import { mockGameDeps     } from '../testing';
import { TestGameConfig   } from '../testing';

import { ChessGame } from '../../game/ChessGame';

function newTestGame(cfg: TestGameConfig): ChessGame {
	return new ChessGame(mockGameDeps(cfg));
}

let cfg: TestGameConfig;

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
	cfg = new TestGameConfig();
});

describe('ChessGame', () => {
	test('init', () => {
		const game = newTestGame(cfg);
		game.init();
	});
});
