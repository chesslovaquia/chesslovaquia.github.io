// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, beforeEach, afterEach, describe } from 'vitest';

import { setupGameTestDOM } from '../testing';

import { ConfigError } from '../../config/ConfigError';

import { GameError  } from '../../game/GameError';
import { gameInit   } from '../../game/game';

import { ElementIds } from '../../clvq/ElementIds';

beforeEach(() => {
	vi.stubGlobal('location', { search: '', pathname: '/play/', href: '', assign: vi.fn() });
	setupGameTestDOM();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('game', () => {
	test('init', () => {
		gameInit();
	});
	test('board error', () => {
		document.getElementById(ElementIds.chessboard)?.remove();
		expect(() => {
			gameInit();
		}).toThrow(GameError);
	});
	test('internal error', () => {
		document.getElementById(`${ElementIds.gamePlayer}1`)?.remove();
		expect(() => {
			gameInit();
		}).toThrow(ConfigError);
	});
});
