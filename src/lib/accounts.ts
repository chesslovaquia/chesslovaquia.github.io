// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { writable } from 'svelte/store';
import { Store } from './db';
import { DB_ACCOUNTS, LS_SELECTED_ACCOUNT } from './config';
import { logger } from './logger';

export type Network = 'otb' | 'lichess' | 'chesscom';

export interface Account {
  id: string;
  network: Network;
  displayName: string;
  handle: string | null;
  credentials: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: number | null;
  } | null;
  createdAt: number;
}

const store = new Store<Account>(DB_ACCOUNTS);

/** Reactive list of all accounts. */
export const accounts = writable<Account[]>([]);

/** Currently selected account. */
export const selectedAccount = writable<Account | null>(null);

/** Load accounts from IndexedDB and populate Svelte stores. */
export async function init(): Promise<void> {
  const all = await store.getAll();
  accounts.set(all);
  const savedId = localStorage.getItem(LS_SELECTED_ACCOUNT);
  const saved = savedId ? all.find((a) => a.id === savedId) ?? null : null;
  selectedAccount.set(saved ?? all[0] ?? null);
  logger.debug('accounts init', all.length);
}

/**
 * Create a "Guest" OTB account if no accounts exist.
 * Idempotent — safe to call on every load.
 */
export async function ensureGuest(): Promise<void> {
  const all = await store.getAll();
  if (all.length > 0) return;
  const guest: Account = {
    id: crypto.randomUUID(),
    network: 'otb',
    displayName: 'Guest',
    handle: null,
    credentials: null,
    createdAt: Date.now(),
  };
  await store.put(guest);
  accounts.set([guest]);
  selectedAccount.set(guest);
  logger.debug('created Guest account', guest.id);
}

/** Persist a new or updated account. */
export async function saveAccount(account: Account): Promise<void> {
  await store.put(account);
  accounts.update((list) => {
    const idx = list.findIndex((a) => a.id === account.id);
    if (idx >= 0) {
      const updated = [...list];
      updated[idx] = account;
      return updated;
    }
    return [...list, account];
  });
}

/** Remove an account by id. */
export async function removeAccount(id: string): Promise<void> {
  await store.delete(id);
  accounts.update((list) => list.filter((a) => a.id !== id));
  selectedAccount.update((sel) => (sel?.id === id ? null : sel));
}

/** Persist selected account id to localStorage. */
export function persistSelection(account: Account | null): void {
  if (account) {
    localStorage.setItem(LS_SELECTED_ACCOUNT, account.id);
  } else {
    localStorage.removeItem(LS_SELECTED_ACCOUNT);
  }
}

/** Return all accounts from the store. */
export async function getAllAccounts(): Promise<Account[]> {
  return store.getAll();
}

/** Clear all accounts (used in tests). */
export async function clearAll(): Promise<void> {
  await store.clear();
  accounts.set([]);
  selectedAccount.set(null);
}
