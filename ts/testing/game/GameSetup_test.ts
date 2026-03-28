// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, describe, beforeEach, afterEach } from 'vitest';

import { GameSetup } from '../../game/GameSetup';

describe('GameSetup', () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		sessionStorage.clear();
	});

	test('newGame stores data in sessionStorage and navigates', () => {
		const assignMock = vi.fn();
		vi.stubGlobal('location', { search: '', pathname: '/', href: '', assign: assignMock });
		const setup = new GameSetup();
		setup.newGame({ time: 600, increment: 0, desc: '10+0' });
		expect(sessionStorage.getItem('clvq.setup')).toBe(
			JSON.stringify({ time: 600, increment: 0, desc: '10+0' }),
		);
		expect(assignMock).toHaveBeenCalledWith('/play/');
		vi.unstubAllGlobals();
	});

	test('getGame returns data from sessionStorage', () => {
		sessionStorage.setItem('clvq.setup', JSON.stringify({ time: 300, increment: 5, desc: '5+5' }));
		const setup = new GameSetup();
		const game = setup.getGame();
		expect(game).toEqual({ time: 300, increment: 5, desc: '5+5' });
	});

	test('getGame returns undefined when no data', () => {
		const setup = new GameSetup();
		const game = setup.getGame();
		expect(game).toBeUndefined();
	});

	test('removeGame clears sessionStorage', () => {
		sessionStorage.setItem('clvq.setup', JSON.stringify({ time: 600, increment: 0, desc: '10+0' }));
		const setup = new GameSetup();
		setup.removeGame();
		expect(sessionStorage.getItem('clvq.setup')).toBeNull();
		expect(setup.description()).toBe('NOGAME');
	});

	test('description returns desc from loaded data', () => {
		sessionStorage.setItem('clvq.setup', JSON.stringify({ time: 600, increment: 0, desc: '10+0' }));
		const setup = new GameSetup();
		setup.getGame();
		expect(setup.description()).toBe('10+0');
	});

	test('timeControlDesc returns formatted string', () => {
		sessionStorage.setItem('clvq.setup', JSON.stringify({ time: 600, increment: 10, desc: '10+10' }));
		const setup = new GameSetup();
		setup.getGame();
		expect(setup.timeControlDesc()).toBe('600+10');
	});
});
