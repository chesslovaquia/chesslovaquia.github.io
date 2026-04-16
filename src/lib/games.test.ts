// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, beforeEach } from 'vitest';
import { saveGame, getAllGames, getGame, deleteGame, clearAll } from './games';
import type { Game } from './games';

function makeGame(id: string): Game {
  return {
    id,
    source: 'otb',
    sourceGameId: null,
    whiteAccountId: 'w1',
    blackAccountId: 'b1',
    pgn: '1. e4 e5',
    result: '1-0',
    timeControlBucket: 'rapid',
    timeControlRaw: { initialSec: 600, incrementSec: 0 },
    openingEco: null,
    playedAt: Date.now(),
    importedAt: Date.now(),
  };
}

describe('games store', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('saves and retrieves a game', async () => {
    const g = makeGame('game-1');
    await saveGame(g);
    const got = await getGame('game-1');
    expect(got).toBeDefined();
    expect(got?.result).toBe('1-0');
  });

  it('getAllGames returns all saved games', async () => {
    await saveGame(makeGame('g1'));
    await saveGame(makeGame('g2'));
    const all = await getAllGames();
    expect(all.length).toBe(2);
  });

  it('deleteGame removes the record', async () => {
    await saveGame(makeGame('g-del'));
    await deleteGame('g-del');
    const got = await getGame('g-del');
    expect(got).toBeUndefined();
  });

  it('getGame returns undefined for missing id', async () => {
    const got = await getGame('no-such-id');
    expect(got).toBeUndefined();
  });

  it('clearAll empties the store', async () => {
    await saveGame(makeGame('g1'));
    await clearAll();
    const all = await getAllGames();
    expect(all.length).toBe(0);
  });

  it('saveGame overwrites on same id', async () => {
    await saveGame(makeGame('g-over'));
    const updated = { ...makeGame('g-over'), result: '0-1' as const };
    await saveGame(updated);
    const got = await getGame('g-over');
    expect(got?.result).toBe('0-1');
  });
});
