// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, describe } from 'vitest';

import { ClvqIndexedDB, Store } from '../../clvq/ClvqIndexedDB';

test('open', () => {
	const db = new ClvqIndexedDB(Store.state);
	expect(db.store).toBe('state');
});

describe('db', () => {
	const db = new ClvqIndexedDB(Store.state);
	test('setItem', () => {
		db.setItem('test', 'ing');
	});
	test('hasItem', () => {
		db.hasItem('testing');
	});
	test('getItem', () => {
		db.getItem('testing');
	});
	test('removeItem', () => {
		db.removeItem('testing');
	});
	test('clearAll', () => {
		db.clearAll();
	});
});


