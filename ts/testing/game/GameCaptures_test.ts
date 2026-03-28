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

describe('GameCaptures', () => {
	test('getState returns captures state', () => {
		const deps = mockGameDeps(cfg);
		const captures = (deps.nav as any).captures;
		const state = captures.getState();
		expect(state).toHaveProperty('captures');
		expect(state).toHaveProperty('count');
		expect(state.captures).toHaveProperty('w');
		expect(state.captures).toHaveProperty('b');
	});

	test('addPosition increments index', () => {
		const deps = mockGameDeps(cfg);
		const captures = (deps.nav as any).captures;
		expect(captures.getIndex()).toBe(-1);
		captures.addPosition();
		expect(captures.getIndex()).toBe(0);
	});

	test('setPosition completes without error', () => {
		const deps = mockGameDeps(cfg);
		const captures = (deps.nav as any).captures;
		captures.addPosition();
		expect(() => captures.setPosition(0)).not.toThrow();
	});
});
