// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, describe, vi } from 'vitest';

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

describe('failure recovery', () => {
	test('clears cached promise on open failure, allowing retry', async () => {
		const db = new ClvqIndexedDB(Store.state);

		// Mock indexedDB.open to fail asynchronously (mimics real IDB behavior)
		const openSpy = vi.spyOn(globalThis.indexedDB, 'open').mockImplementationOnce(() => {
			const req: Record<string, unknown> = {
				error: new DOMException('Simulated open failure'),
			};
			// Fire onerror in a microtask so this.promise is already set when it runs
			queueMicrotask(() => {
				if (typeof req['onerror'] === 'function') (req['onerror'] as () => void)();
			});
			return req as unknown as IDBOpenDBRequest;
		});

		// First call: should reject
		await expect(db.getItem('key')).rejects.toBeDefined();

		// Restore real indexedDB
		openSpy.mockRestore();

		// Second call: cached promise was cleared, fresh open succeeds
		await expect(db.getItem('key')).resolves.toBeNull();
	});
});
