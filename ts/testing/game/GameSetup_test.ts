// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, describe, afterEach } from 'vitest';

import { ClvqIndexedDB } from '../../clvq/ClvqIndexedDB';
import { GameSetup     } from '../../game/GameSetup';

describe('GameSetup.removeGame', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('clears data and resolves on success', async () => {
		vi.spyOn(ClvqIndexedDB.prototype, 'removeItem').mockResolvedValue(undefined);
		const setup = new GameSetup();
		await setup.removeGame();
		expect(setup.description()).toBe('NOGAME');
		expect(ClvqIndexedDB.prototype.removeItem).toHaveBeenCalledWith('setup');
	});

	test('rejects when removeItem rejects', async () => {
		const err = new Error('idb error');
		vi.spyOn(ClvqIndexedDB.prototype, 'removeItem').mockRejectedValue(err);
		const setup = new GameSetup();
		await expect(setup.removeGame()).rejects.toThrow('idb error');
	});
});
