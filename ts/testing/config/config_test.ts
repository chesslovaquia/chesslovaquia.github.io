// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, describe, expect, beforeEach } from 'vitest';

import { ConfigError  } from '../../config/ConfigError';
import { ConfigGameUI } from '../../config/ConfigGameUI';

import { mockConfigGameUI } from '../testing';

const board = document.createElement('div');

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
});

describe('ConfigGamePlayer error', () => {
	test('gamePlayer1', () => {
		document.getElementById('gamePlayer1')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameClock1', () => {
		document.getElementById('gameClock1')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameMaterial1', () => {
		document.getElementById('gameMaterial1')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameMaterialCount1', () => {
		document.getElementById('gameMaterialCount1')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gamePlayer2', () => {
		document.getElementById('gamePlayer2')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameClock2', () => {
		document.getElementById('gameClock2')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameMaterial2', () => {
		document.getElementById('gameMaterial2')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameMaterialCount2', () => {
		document.getElementById('gameMaterialCount2')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
});

describe('ConfigGameUI', () => {
	test('board', () => {
		new ConfigGameUI(board);
	});
});
