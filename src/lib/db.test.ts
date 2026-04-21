// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from './db';

interface Item {
  id: string;
  value: string;
}

const store = new Store<Item>('clvq.db-test.v1');

beforeEach(async () => {
  await store.clear();
});

describe('Store', () => {
  describe('get', () => {
    it('returns undefined for a missing id', async () => {
      expect(await store.get('no-such-id')).toBeUndefined();
    });

    it('returns the record after put', async () => {
      await store.put({ id: 'a', value: 'hello' });
      const result = await store.get('a');
      expect(result).toEqual({ id: 'a', value: 'hello' });
    });
  });

  describe('getAll', () => {
    it('returns empty array when store is empty', async () => {
      expect(await store.getAll()).toEqual([]);
    });

    it('returns all stored records', async () => {
      await store.put({ id: 'x', value: '1' });
      await store.put({ id: 'y', value: '2' });
      const all = await store.getAll();
      expect(all).toHaveLength(2);
      expect(all.map(r => r.id).sort()).toEqual(['x', 'y']);
    });
  });

  describe('put', () => {
    it('stores a new record', async () => {
      await store.put({ id: 'new', value: 'v' });
      expect(await store.get('new')).toBeDefined();
    });

    it('overwrites an existing record with the same id', async () => {
      await store.put({ id: 'dup', value: 'first' });
      await store.put({ id: 'dup', value: 'second' });
      const result = await store.get('dup');
      expect(result?.value).toBe('second');
    });
  });

  describe('delete', () => {
    it('removes an existing record', async () => {
      await store.put({ id: 'del', value: 'gone' });
      await store.delete('del');
      expect(await store.get('del')).toBeUndefined();
    });

    it('is a no-op for a missing id', async () => {
      await expect(store.delete('phantom')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('removes all records', async () => {
      await store.put({ id: '1', value: 'a' });
      await store.put({ id: '2', value: 'b' });
      await store.clear();
      expect(await store.getAll()).toEqual([]);
    });

    it('is safe to call on an already-empty store', async () => {
      await expect(store.clear()).resolves.toBeUndefined();
    });
  });
});
