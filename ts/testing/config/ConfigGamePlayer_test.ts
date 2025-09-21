// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, describe, expect, beforeEach } from 'vitest';

import { ConfigError      } from '../../config/ConfigError';
import { ConfigGamePlayer } from '../../config/ConfigGamePlayer';

import { mockConfigGameUI } from '../testing';

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
});

describe('ConfigGamePlayer', () => {
	test('p1', () => {
		new ConfigGamePlayer('1');
	});
	test('p2', () => {
		new ConfigGamePlayer('2');
	});
});

describe('ConfigGamePlayer error', () => {
	test('gamePlayer1', () => {
		document.getElementById('gamePlayer1')?.remove();
		expect(() => {
			new ConfigGamePlayer('1');
		}).toThrow(ConfigError);
	});
	test('gameClock1', () => {
		document.getElementById('gameClock1')?.remove();
		expect(() => {
			new ConfigGamePlayer('1');
		}).toThrow(ConfigError);
	});
	test('gameMaterial1', () => {
		document.getElementById('gameMaterial1')?.remove();
		expect(() => {
			new ConfigGamePlayer('1');
		}).toThrow(ConfigError);
	});
	test('gameMaterialCount1', () => {
		document.getElementById('gameMaterialCount1')?.remove();
		expect(() => {
			new ConfigGamePlayer('1');
		}).toThrow(ConfigError);
	});
	test('gamePlayer2', () => {
		document.getElementById('gamePlayer2')?.remove();
		expect(() => {
			new ConfigGamePlayer('2');
		}).toThrow(ConfigError);
	});
	test('gameClock2', () => {
		document.getElementById('gameClock2')?.remove();
		expect(() => {
			new ConfigGamePlayer('2');
		}).toThrow(ConfigError);
	});
	test('gameMaterial2', () => {
		document.getElementById('gameMaterial2')?.remove();
		expect(() => {
			new ConfigGamePlayer('2');
		}).toThrow(ConfigError);
	});
	test('gameMaterialCount2', () => {
		document.getElementById('gameMaterialCount2')?.remove();
		expect(() => {
			new ConfigGamePlayer('2');
		}).toThrow(ConfigError);
	});
});
