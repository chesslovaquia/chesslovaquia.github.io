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

describe('ConfigGameUI', () => {
	test('board', () => {
		new ConfigGameUI(board);
	});
});

describe('ConfigGameUI error', () => {
	test('gameDescription', () => {
		document.getElementById('gameDescription')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameStatus', () => {
		document.getElementById('gameStatus')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameOutcome', () => {
		document.getElementById('gameOutcome')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameReset', () => {
		document.getElementById('gameReset')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameNavBackward', () => {
		document.getElementById('gameNavBackward')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameNavForward', () => {
		document.getElementById('gameNavForward')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameFlipBoard', () => {
		document.getElementById('gameFlipBoard')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameNavFirstMove', () => {
		document.getElementById('gameNavFirstMove')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameNavLastMove', () => {
		document.getElementById('gameNavLastMove')?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
});
