// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, beforeEach, describe } from 'vitest';

import { mockConfigGameUI } from '../testing';

import { ConfigError } from '../../config/ConfigError';

import { GameError  } from '../../game/GameError';
import { gameInit   } from '../../game/game';

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
	window.location.pathname = '/play/mobile/';
	window.innerWidth = 360;
	window.innerHeight = 640;
});

describe('game', () => {
	test('screen load', () => {
		window.location.pathname = '/';
		window.innerWidth = 640;
		window.innerHeight = 360;
		gameInit();
	});
	test('init', () => {
		gameInit();
	});
	test('board error', () => {
		document.getElementById('chessboard')?.remove();
		expect(() => {
			gameInit();
		}).toThrow(GameError);
	});
	test('internal error', () => {
		document.getElementById('gamePlayer1')?.remove();
		expect(() => {
			gameInit();
		}).toThrow(ConfigError);
	});
});
