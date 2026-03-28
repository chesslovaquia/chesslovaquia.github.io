// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, describe, afterEach } from 'vitest';

import { ClvqIndexedDB  } from '../../clvq/ClvqIndexedDB';
import { GameStateImpl  } from '../../game/GameState';
import { GameSetup      } from '../../game/GameSetup';
import { logger         } from '../../clvq/Logger';

import type { GameEngine   } from '../../engine/GameEngine';
import type { GameClock    } from '../../game/GameClock';
import type { GameNavigate } from '../../game/GameNavigate';
import type { GameHistory  } from '../../game/GameHistory';

function makeState(setup?: GameSetup): GameStateImpl {
	const engine = {
		getState: vi.fn(() => []),
		setState: vi.fn(),
		turn:     vi.fn(() => 'w'),
		pgn:      vi.fn(() => ''),
		fen:      vi.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
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
		addPosition:  vi.fn(),
		addPromotion: vi.fn(),
		flip:         vi.fn(),
	} as unknown as GameNavigate;
	const history = {
		save:   vi.fn().mockResolvedValue(undefined),
		list:   vi.fn().mockResolvedValue([]),
		delete: vi.fn().mockResolvedValue(undefined),
	} as unknown as GameHistory;
	return new GameStateImpl(engine, clock, nav, setup ?? new GameSetup(), history);
}

describe('GameStateImpl.reset', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		sessionStorage.clear();
	});

	test('logs error when removeItem rejects', async () => {
		const err = new Error('idb remove error');
		vi.spyOn(ClvqIndexedDB.prototype, 'removeItem').mockRejectedValue(err);
		const state = makeState();
		const errorSpy = vi.spyOn(logger, 'error');
		state.reset();
		await vi.waitFor(() => {
			expect(errorSpy).toHaveBeenCalledWith('State reset error:', err);
		});
	});

	test('clears sessionStorage on reset', () => {
		sessionStorage.setItem('clvq.setup', JSON.stringify({ time: 600, increment: 0, desc: '10+0' }));
		vi.spyOn(ClvqIndexedDB.prototype, 'removeItem').mockResolvedValue(undefined);
		const state = makeState();
		state.reset();
		expect(sessionStorage.getItem('clvq.setup')).toBeNull();
	});
});
