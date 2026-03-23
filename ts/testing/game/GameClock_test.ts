// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, beforeEach, afterEach, describe } from 'vitest';

import { mockConfigGameUI } from '../testing';
import { mockGameDeps     } from '../testing';
import { TestGameConfig   } from '../testing';

import { EventClockTimeout } from '../../events/EventClockTimeout';

let cfg: TestGameConfig;

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
	cfg = new TestGameConfig();
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('GameClock', () => {
	test('start returns true', () => {
		const deps = mockGameDeps(cfg);
		expect(deps.clock.start()).toBe(true);
		deps.clock.stop();
	});

	test('start twice returns false on second call', () => {
		const deps = mockGameDeps(cfg);
		deps.clock.start();
		expect(deps.clock.start()).toBe(false);
		deps.clock.stop();
	});

	test('stop returns true when running', () => {
		const deps = mockGameDeps(cfg);
		deps.clock.start();
		expect(deps.clock.stop()).toBe(true);
	});

	test('stop returns false when not running', () => {
		const deps = mockGameDeps(cfg);
		expect(deps.clock.stop()).toBe(false);
	});

	test('first move timeout dispatches EventClockTimeout', () => {
		const deps = mockGameDeps(cfg);
		const listener = vi.fn();
		EventClockTimeout.Target.addEventListener(EventClockTimeout.Name, listener);
		deps.clock.start();
		// Advance past first move timeout (30 seconds = 30000ms)
		vi.advanceTimersByTime(31000);
		expect(listener).toHaveBeenCalled();
		deps.clock.stop();
		EventClockTimeout.Target.removeEventListener(EventClockTimeout.Name, listener);
	});

	test('getState returns clock state', () => {
		const deps = mockGameDeps(cfg);
		const state = deps.clock.getState();
		expect(state).toHaveProperty('tstamp');
		expect(state).toHaveProperty('initialTime');
		expect(state).toHaveProperty('increment');
		expect(state).toHaveProperty('time');
		expect(state).toHaveProperty('firstMove');
		expect(state).toHaveProperty('firstMoveTime');
	});

	test('setState restores clock state', () => {
		const deps = mockGameDeps(cfg);
		const state = deps.clock.getState();
		state.firstMove = false;
		deps.clock.setState(state);
		const restored = deps.clock.getState();
		expect(restored.firstMove).toBe(false);
	});
});
