// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, describe } from 'vitest';

import { ClvqIndexedDB, Store } from '../../clvq/ClvqIndexedDB';

test('open', () => {
	const db = new ClvqIndexedDB(Store.state);
	expect(db).toBeDefined();
});

describe('db', () => {
	const db = new ClvqIndexedDB(Store.state);
	test('setItem', async () => {
		await expect(db.setItem('test', 'ing')).resolves.toBeUndefined();
	});
	test('hasItem', async () => {
		await expect(db.hasItem('test')).resolves.toBe(true);
	});
	test('getItem', async () => {
		await expect(db.getItem('test')).resolves.toBe('ing');
	});
	test('removeItem', async () => {
		await expect(db.removeItem('test')).resolves.toBeUndefined();
		await expect(db.hasItem('test')).resolves.toBe(false);
	});
	test('clearAll', async () => {
		await db.setItem('a', 1);
		await db.setItem('b', 2);
		await expect(db.clearAll()).resolves.toBeUndefined();
		await expect(db.hasItem('a')).resolves.toBe(false);
	});
});
