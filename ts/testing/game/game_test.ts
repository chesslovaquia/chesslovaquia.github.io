// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, beforeEach, describe } from 'vitest';

import { mockConfigGameUI } from '../testing';

import { GameConfig } from '../../game/GameConfig';
import { ChessGame  } from '../../game/ChessGame';
import { GameError  } from '../../game/GameError';

import { gameInit } from '../../game/game';

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

describe('game', () => {
	test('screen load', () => {
		gameInit();
	});
	test('init', () => {
		window.location.pathname = '/play/mobile/';
		window.innerWidth = 360;
		window.innerHeight = 640;
		gameInit();
	});
	test('board error', () => {
		window.location.pathname = '/play/mobile/';
		window.innerWidth = 360;
		window.innerHeight = 640;
		document.getElementById('chessboard')?.remove();
		expect(() => {
			gameInit();
		}).toThrow(GameError);
	});
});

//~ describe('ChessGame', () => {
	//~ test('init', () => {
		//~ new ChessGame(cfg);
	//~ });
//~ });
