// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, beforeEach } from 'vitest';

import { mockConfigGameUI } from '../testing';

import { GameConfig } from '../../game/GameConfig';
import { ChessGame  } from '../../game/ChessGame';

const board = document.createElement('div');

let cfg: GameConfig | null = null;

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
	cfg = new GameConfig(board) as GameConfig;
});

test('init', () => {
	new ChessGame(cfg);
});
