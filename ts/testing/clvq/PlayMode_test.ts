// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, test, expect, beforeEach } from 'vitest';

import { ClvqLocalStorage } from '../../clvq/ClvqLocalStorage';
import { PlayModeStorage  } from '../../clvq/PlayMode';

describe('PlayModeStorage', () => {
	let storage: PlayModeStorage;

	beforeEach(() => {
		localStorage.clear();
		storage = new PlayModeStorage(new ClvqLocalStorage());
	});

	test('defaults to otb when nothing stored', () => {
		expect(storage.getMode()).toBe('otb');
	});

	test('persists and retrieves lichess mode', () => {
		storage.setMode('lichess');
		expect(storage.getMode()).toBe('lichess');
	});

	test('persists and retrieves otb mode', () => {
		storage.setMode('lichess');
		storage.setMode('otb');
		expect(storage.getMode()).toBe('otb');
	});

	test('falls back to otb for invalid stored value', () => {
		localStorage.setItem('clvq.play_mode', 'bogus');
		expect(storage.getMode()).toBe('otb');
	});

	test('falls back to otb for empty stored value', () => {
		localStorage.setItem('clvq.play_mode', '');
		expect(storage.getMode()).toBe('otb');
	});
});
