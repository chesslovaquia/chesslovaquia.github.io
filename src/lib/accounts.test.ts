// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  accounts,
  selectedAccount,
  ensureGuest,
  init,
  saveAccount,
  removeAccount,
  clearAll,
  type Account,
} from './accounts';

beforeEach(async () => {
  await clearAll();
});

describe('ensureGuest', () => {
  it('creates a Guest account when none exist', async () => {
    await ensureGuest();
    const list = get(accounts);
    expect(list).toHaveLength(1);
    expect(list[0].displayName).toBe('Guest');
    expect(list[0].network).toBe('otb');
    expect(list[0].handle).toBeNull();
    expect(list[0].credentials).toBeNull();
  });

  it('sets selected account to Guest', async () => {
    await ensureGuest();
    const sel = get(selectedAccount);
    expect(sel?.displayName).toBe('Guest');
  });

  it('is idempotent — does not create a second account', async () => {
    await ensureGuest();
    await ensureGuest();
    const list = get(accounts);
    expect(list).toHaveLength(1);
  });
});

describe('init', () => {
  it('loads accounts from the store', async () => {
    await ensureGuest();
    accounts.set([]);
    selectedAccount.set(null);
    await init();
    expect(get(accounts)).toHaveLength(1);
    expect(get(selectedAccount)?.displayName).toBe('Guest');
  });

  it('selects nothing when the store is empty', async () => {
    await init();
    expect(get(accounts)).toHaveLength(0);
    expect(get(selectedAccount)).toBeNull();
  });
});

describe('saveAccount', () => {
  it('adds a new account to the list', async () => {
    const acc: Account = {
      id: 'test-id-1',
      network: 'otb',
      displayName: 'Player 1',
      handle: null,
      credentials: null,
      createdAt: Date.now(),
    };
    await saveAccount(acc);
    expect(get(accounts)).toHaveLength(1);
    expect(get(accounts)[0].displayName).toBe('Player 1');
  });

  it('updates an existing account in place', async () => {
    const acc: Account = {
      id: 'test-id-2',
      network: 'otb',
      displayName: 'Original',
      handle: null,
      credentials: null,
      createdAt: Date.now(),
    };
    await saveAccount(acc);
    await saveAccount({ ...acc, displayName: 'Updated' });
    const list = get(accounts);
    expect(list).toHaveLength(1);
    expect(list[0].displayName).toBe('Updated');
  });
});

describe('removeAccount', () => {
  it('removes the account from the list', async () => {
    await ensureGuest();
    const id = get(accounts)[0].id;
    await removeAccount(id);
    expect(get(accounts)).toHaveLength(0);
  });

  it('clears selected account when it is removed', async () => {
    await ensureGuest();
    const id = get(accounts)[0].id;
    selectedAccount.set(get(accounts)[0]);
    await removeAccount(id);
    expect(get(selectedAccount)).toBeNull();
  });
});
