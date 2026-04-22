// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  accounts,
  selectedAccount,
  ensureOtbAccounts,
  init,
  saveAccount,
  removeAccount,
  clearAll,
  type Account,
} from './accounts';
import { OTB_GUEST_ID, OTB_USER_ID } from './config';

beforeEach(async () => {
  await clearAll();
});

describe('ensureOtbAccounts', () => {
  it('creates both Guest and User accounts', async () => {
    await ensureOtbAccounts();
    const list = get(accounts);
    expect(list).toHaveLength(2);
    const guest = list.find((a) => a.id === OTB_GUEST_ID);
    const user = list.find((a) => a.id === OTB_USER_ID);
    expect(guest?.displayName).toBe('Guest');
    expect(user?.displayName).toBe('User');
  });

  it('creates only Guest the first time if User is missing', async () => {
    await ensureOtbAccounts();
    let list = get(accounts);
    expect(list).toHaveLength(2);

    // Remove User and call again
    const user = list.find((a) => a.id === OTB_USER_ID);
    if (user) {
      await removeAccount(user.id);
    }
    await ensureOtbAccounts();
    list = get(accounts);
    expect(list).toHaveLength(2);
    expect(list.find((a) => a.id === OTB_USER_ID)?.displayName).toBe('User');
  });

  it('is idempotent — calling twice creates no duplicates', async () => {
    await ensureOtbAccounts();
    await ensureOtbAccounts();
    const list = get(accounts);
    expect(list).toHaveLength(2);
  });

  it('sets User as the selected account', async () => {
    await ensureOtbAccounts();
    const sel = get(selectedAccount);
    expect(sel?.id).toBe(OTB_USER_ID);
    expect(sel?.displayName).toBe('User');
  });
});

describe('init', () => {
  it('loads accounts from the store', async () => {
    await ensureOtbAccounts();
    accounts.set([]);
    selectedAccount.set(null);
    await init();
    expect(get(accounts)).toHaveLength(2);
    expect(get(selectedAccount)?.id).toBe(OTB_USER_ID);
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
    await ensureOtbAccounts();
    const id = get(accounts)[0].id;
    await removeAccount(id);
    expect(get(accounts)).toHaveLength(1);
  });

  it('clears selected account when it is removed', async () => {
    await ensureOtbAccounts();
    const user = get(accounts).find((a) => a.id === OTB_USER_ID);
    if (user) {
      selectedAccount.set(user);
      await removeAccount(user.id);
      expect(get(selectedAccount)).toBeNull();
    }
  });
});
