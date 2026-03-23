// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, describe, expect, beforeEach } from 'vitest';

import { ConfigError  } from '../../config/ConfigError';
import { ConfigGameUI } from '../../config/ConfigGameUI';

import { mockConfigGameUI } from '../testing';
import { ElementIds       } from '../../clvq/ElementIds';

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
		document.getElementById(ElementIds.gameDescription)?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameStatus', () => {
		document.getElementById(ElementIds.gameStatus)?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameOutcome', () => {
		document.getElementById(ElementIds.gameOutcome)?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameReset', () => {
		document.getElementById(ElementIds.gameReset)?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameNavBackward', () => {
		document.getElementById(ElementIds.gameNavBackward)?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameNavForward', () => {
		document.getElementById(ElementIds.gameNavForward)?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameFlipBoard', () => {
		document.getElementById(ElementIds.gameFlipBoard)?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameNavFirstMove', () => {
		document.getElementById(ElementIds.gameNavFirstMove)?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
	test('gameNavLastMove', () => {
		document.getElementById(ElementIds.gameNavLastMove)?.remove();
		expect(() => {
			new ConfigGameUI(board);
		}).toThrow(ConfigError);
	});
});
