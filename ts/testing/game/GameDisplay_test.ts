// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, beforeEach, describe } from 'vitest';

import { mockConfigGameUI } from '../testing';
import { TestGameConfig   } from '../testing';

import { GameConfig  } from '../../game/GameConfig';
import { GameDisplay } from '../../game/GameDisplay';
import { GameEngine  } from '../../engine/GameEngine';
import { GameMove    } from '../../game/GameMove';

let cfg: TestGameConfig;
let display: GameDisplay;

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
	cfg = new TestGameConfig();
	document.body.appendChild(cfg.boardUI);
	const gameCfg = new GameConfig(cfg.boardUI);
	display = new GameDisplay(
		gameCfg,
		null as unknown as GameEngine,
		null as unknown as GameMove,
	);
});

// --- setOpponentInfo ---

describe('GameDisplay.setOpponentInfo', () => {
	test('sets player name with rating', () => {
		display.setOpponentInfo(2, 'Magnus', 2800);
		expect(document.getElementById('gamePlayer2')?.textContent).toBe('Magnus');
		expect(document.getElementById('gamePlayerRating2')?.textContent).toBe('(2800)');
		expect(document.getElementById('gamePlayerRating2')?.style.display).toBe('');
	});

	test('sets player name without rating', () => {
		display.setOpponentInfo(1, 'Anon');
		expect(document.getElementById('gamePlayer1')?.textContent).toBe('Anon');
		expect(document.getElementById('gamePlayerRating1')?.style.display).toBe('none');
	});

	test('prepends title when provided', () => {
		display.setOpponentInfo(1, 'Carlsen', 2830, 'GM');
		expect(document.getElementById('gamePlayer1')?.textContent).toBe('GM Carlsen');
	});

	test('hides rating element when rating is absent', () => {
		// Ensure rating is hidden by default (no rating passed)
		display.setOpponentInfo(2, 'Player');
		expect(document.getElementById('gamePlayerRating2')?.style.display).toBe('none');
	});
});

// --- showActionsBar / hideActionsBar ---

describe('GameDisplay.showActionsBar', () => {
	test('makes actions bar visible', () => {
		display.showActionsBar();
		expect(document.getElementById('gameActionsBar')?.style.display).toBe('');
	});

	test('does not throw when element is absent', () => {
		document.getElementById('gameActionsBar')?.remove();
		expect(() => display.showActionsBar()).not.toThrow();
	});
});

describe('GameDisplay.hideActionsBar', () => {
	test('hides the actions bar', () => {
		const bar = document.getElementById('gameActionsBar')!;
		bar.style.display = '';
		display.hideActionsBar();
		expect(bar.style.display).toBe('none');
	});

	test('does not throw when element is absent', () => {
		document.getElementById('gameActionsBar')?.remove();
		expect(() => display.hideActionsBar()).not.toThrow();
	});
});
