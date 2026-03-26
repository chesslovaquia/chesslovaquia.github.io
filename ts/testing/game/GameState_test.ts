// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, describe, afterEach } from 'vitest';

import { ClvqIndexedDB  } from '../../clvq/ClvqIndexedDB';
import { GameStateImpl  } from '../../game/GameState';
import { GameSetup      } from '../../game/GameSetup';
import { logger         } from '../../clvq/Logger';

import type { GameEngine  } from '../../engine/GameEngine';
import type { GameClock   } from '../../game/GameClock';
import type { GameNavigate } from '../../game/GameNavigate';
import type { GameHistory } from '../../game/GameHistory';

function makeState(setup: GameSetup): GameStateImpl {
	const engine = {
		getState: vi.fn(() => []),
		setState: vi.fn(),
		turn:     vi.fn(() => 'w'),
		pgn:      vi.fn(() => ''),
	} as unknown as GameEngine;
	const clock = {
		getState:              vi.fn(() => ({})),
		setState:              vi.fn(),
		setupNewGame:          vi.fn(),
		disableFirstMoveTimer: vi.fn(),
		move:                  vi.fn(),
		flip:                  vi.fn(),
		start:                 vi.fn(),
		stop:                  vi.fn(),
	} as unknown as GameClock;
	const nav = {
		getState:     vi.fn(() => ({})),
		setState:     vi.fn(),
		addPosition:  vi.fn(),
		addPromotion: vi.fn(),
		flip:         vi.fn(),
	} as unknown as GameNavigate;
	const history = {
		save:   vi.fn().mockResolvedValue(undefined),
		list:   vi.fn().mockResolvedValue([]),
		delete: vi.fn().mockResolvedValue(undefined),
	} as unknown as GameHistory;
	return new GameStateImpl(engine, clock, nav, setup, history);
}

describe('GameStateImpl.reset', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('logs error when removeItem rejects', async () => {
		const err = new Error('idb remove error');
		vi.spyOn(ClvqIndexedDB.prototype, 'removeItem').mockRejectedValue(err);
		const setup = { removeGame: vi.fn().mockResolvedValue(undefined) } as unknown as GameSetup;
		const state = makeState(setup);
		const errorSpy = vi.spyOn(logger, 'error');
		state.reset();
		await vi.waitFor(() => {
			expect(errorSpy).toHaveBeenCalledWith('State reset error:', err);
		});
	});

	test('logs error when removeGame rejects', async () => {
		const err = new Error('setup remove error');
		vi.spyOn(ClvqIndexedDB.prototype, 'removeItem').mockResolvedValue(undefined);
		const setup = { removeGame: vi.fn().mockRejectedValue(err) } as unknown as GameSetup;
		const state = makeState(setup);
		const errorSpy = vi.spyOn(logger, 'error');
		state.reset();
		await vi.waitFor(() => {
			expect(errorSpy).toHaveBeenCalledWith('State setup remove error:', err);
		});
	});
});
