// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, beforeEach, describe } from 'vitest';

import { mockConfigGameUI } from '../testing';

import { GameConfig } from '../../game/GameConfig';
import { ChessGame  } from '../../game/ChessGame';
import { GameError  } from '../../game/GameError';

import '../../game/game';

const board = document.createElement('div');

let cfg: GameConfig;

const origWindowInnerWidth = window.innerWidth;
const origWindowInnerHeight = window.innerHeight;

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
	cfg = new GameConfig(board);
	window.location.pathname = '/';
	window.innerWidth = origWindowInnerWidth;
	window.innerHeight = origWindowInnerHeight;
});

describe('DOM content load', () => {
	test('screen load', () => {
		document.dispatchEvent(new Event('DOMContentLoaded'));
	});
	test('game init', () => {
		window.location.pathname = '/play/mobile/';
		window.innerWidth = 360;
		window.innerHeight = 640;
		document.dispatchEvent(new Event('DOMContentLoaded'));
	});
});

describe('ChessGame', () => {
	test('init', () => {
		new ChessGame(cfg);
	});
});
