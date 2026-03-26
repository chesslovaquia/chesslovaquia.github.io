// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, beforeEach, afterEach, describe } from 'vitest';

import { setupGameTestDOM } from '../testing';
import { mockGameDeps     } from '../testing';
import { TestGameConfig   } from '../testing';

let cfg: TestGameConfig;

beforeEach(() => {
	setupGameTestDOM();
	cfg = new TestGameConfig();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('GameNavigate', () => {
	test('navBackward does not go below index 0', () => {
		const deps = mockGameDeps(cfg);
		// Add initial position (index becomes 0)
		deps.nav.addPosition();
		// Add a second position so backward is enabled (index becomes 1)
		deps.nav.addPosition();
		const state1 = deps.nav.getState();
		expect(state1.index).toBe(1);
		// Trigger backward twice; second call should not go below 0
		(deps.nav as any).navBackward();
		const state2 = deps.nav.getState();
		expect(state2.index).toBe(0);
		(deps.nav as any).navBackward();
		const state3 = deps.nav.getState();
		expect(state3.index).toBe(0);
	});

	test('getState returns nav state', () => {
		const deps = mockGameDeps(cfg);
		deps.nav.addPosition();
		const state = deps.nav.getState();
		expect(state).toHaveProperty('pos');
		expect(state).toHaveProperty('index');
		expect(state).toHaveProperty('moves');
		expect(state).toHaveProperty('captures');
		expect(state.index).toBe(0);
	});

	test('addPosition increments index', () => {
		const deps = mockGameDeps(cfg);
		deps.nav.addPosition();
		const state1 = deps.nav.getState();
		expect(state1.index).toBe(0);
		deps.nav.addPosition();
		const state2 = deps.nav.getState();
		expect(state2.index).toBe(1);
	});

	test('setState restores nav state', () => {
		const deps = mockGameDeps(cfg);
		deps.nav.addPosition();
		deps.nav.addPosition();
		const state = deps.nav.getState();
		deps.nav.setState(state);
		const restored = deps.nav.getState();
		expect(restored.index).toBe(state.index);
		expect(restored.pos).toEqual(state.pos);
	});
});
