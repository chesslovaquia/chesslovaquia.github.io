// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, beforeEach, describe, afterEach } from 'vitest';

import { mockConfigGameUI } from '../testing';
import { mockGameDeps     } from '../testing';
import { TestGameConfig   } from '../testing';

import { ChessGame } from '../../game/ChessGame';

function newTestGame(cfg: TestGameConfig): ChessGame {
	return new ChessGame(mockGameDeps(cfg));
}

let cfg: TestGameConfig;

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
	cfg = new TestGameConfig();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('ChessGame', () => {
	test('init', async () => {
		const game = newTestGame(cfg);
		const spyDisableBoard = vi.spyOn(game, 'disableBoard' as any);
		const spyStart = vi.spyOn(game, 'start' as any);
		const spyStop = vi.spyOn(game, 'stop' as any);
		const spySetup = vi.spyOn(game, 'setup' as any);
		const spyToggleOrientation = vi.spyOn(game, 'toggleOrientation' as any);
		game.init();
		expect(spyDisableBoard).toHaveBeenCalledTimes(1);
		await vi.waitFor(() => {
			expect(spySetup).toHaveBeenCalledTimes(1);
			expect(spyStart).not.toHaveBeenCalled();
			expect(spyStop).not.toHaveBeenCalled();
			expect(spyToggleOrientation).not.toHaveBeenCalled();
		});
	});
	test('state load', async () => {
		cfg.stateLoad = true;
		const game = newTestGame(cfg);
		const spyStart = vi.spyOn(game, 'start' as any);
		const spyStop = vi.spyOn(game, 'stop' as any);
		const spySetup = vi.spyOn(game, 'setup' as any);
		game.init();
		await vi.waitFor(() => {
			expect(spyStart).toHaveBeenCalledTimes(1);
			expect(spyStop).not.toHaveBeenCalled();
			expect(spySetup).not.toHaveBeenCalled();
		});
	});
	test('state load toggle orientation', async () => {
		cfg.stateLoad = true;
		cfg.stateOrientation = 'b';
		const game = newTestGame(cfg);
		const spyToggleOrientation = vi.spyOn(game, 'toggleOrientation' as any);
		game.init();
		await vi.waitFor(() => {
			expect(spyToggleOrientation).toHaveBeenCalledTimes(1);
		});
	});
});
