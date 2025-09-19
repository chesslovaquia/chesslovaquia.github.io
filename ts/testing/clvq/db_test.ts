// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect } from 'vitest';

import { ClvqIndexedDB, Store } from '../../clvq/ClvqIndexedDB';

test('open', () => {
	const db = new ClvqIndexedDB(Store.state);
	expect(db.store).toBe('state');
});

test('setItem', () => {
	const db = new ClvqIndexedDB(Store.state);
	db.setItem('test', 'ing');
});
