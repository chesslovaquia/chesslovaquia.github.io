// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, describe, expect, beforeEach } from 'vitest';

import { ConfigError      } from '../../config/ConfigError';
import { ConfigGamePlayer } from '../../config/ConfigGamePlayer';

import { mockConfigGameUI } from '../testing';
import { ElementIds       } from '../../clvq/ElementIds';

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
		document.getElementById(`${ElementIds.gamePlayer}1`)?.remove();
		expect(() => {
			new ConfigGamePlayer('1');
		}).toThrow(ConfigError);
	});
	test('gameClock1', () => {
		document.getElementById(`${ElementIds.gameClock}1`)?.remove();
		expect(() => {
			new ConfigGamePlayer('1');
		}).toThrow(ConfigError);
	});
	test('gameMaterial1', () => {
		document.getElementById(`${ElementIds.gameMaterial}1`)?.remove();
		expect(() => {
			new ConfigGamePlayer('1');
		}).toThrow(ConfigError);
	});
	test('gameMaterialCount1', () => {
		document.getElementById(`${ElementIds.gameMaterialCount}1`)?.remove();
		expect(() => {
			new ConfigGamePlayer('1');
		}).toThrow(ConfigError);
	});
	test('gamePlayer2', () => {
		document.getElementById(`${ElementIds.gamePlayer}2`)?.remove();
		expect(() => {
			new ConfigGamePlayer('2');
		}).toThrow(ConfigError);
	});
	test('gameClock2', () => {
		document.getElementById(`${ElementIds.gameClock}2`)?.remove();
		expect(() => {
			new ConfigGamePlayer('2');
		}).toThrow(ConfigError);
	});
	test('gameMaterial2', () => {
		document.getElementById(`${ElementIds.gameMaterial}2`)?.remove();
		expect(() => {
			new ConfigGamePlayer('2');
		}).toThrow(ConfigError);
	});
	test('gameMaterialCount2', () => {
		document.getElementById(`${ElementIds.gameMaterialCount}2`)?.remove();
		expect(() => {
			new ConfigGamePlayer('2');
		}).toThrow(ConfigError);
	});
});
