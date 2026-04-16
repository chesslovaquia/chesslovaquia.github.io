// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseUci,
  toUci,
  isGameFull,
  isGameState,
  isTerminalStatus,
  persistActiveGame,
  getActiveGame,
  clearActiveGame,
} from './play';
import type { LichessActive } from './play';

describe('parseUci', () => {
  it('parses a normal move', () => {
    expect(parseUci('e2e4')).toEqual({ from: 'e2', to: 'e4' });
  });

  it('parses a promotion move', () => {
    expect(parseUci('e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
  });

  it('parses castling as a normal king move', () => {
    expect(parseUci('e1g1')).toEqual({ from: 'e1', to: 'g1' });
  });
});

describe('toUci', () => {
  it('converts from/to to UCI', () => {
    expect(toUci('e2', 'e4')).toBe('e2e4');
  });

  it('appends promotion piece when provided', () => {
    expect(toUci('e7', 'e8', 'q')).toBe('e7e8q');
  });

  it('does not append when promotion is undefined', () => {
    expect(toUci('d2', 'd4', undefined)).toBe('d2d4');
  });
});

describe('type guards', () => {
  it('isGameFull identifies gameFull events', () => {
    expect(isGameFull({ type: 'gameFull', id: 'x', speed: 'rapid', rated: false, white: { id: 'a', name: 'A' }, black: { id: 'b', name: 'B' }, state: { type: 'gameState', moves: '', wc: 0, bc: 0, status: 'started' } })).toBe(true);
    expect(isGameFull({ type: 'gameState' })).toBe(false);
  });

  it('isGameState identifies gameState events', () => {
    expect(isGameState({ type: 'gameState', moves: 'e2e4', wc: 5000, bc: 5000, status: 'started' })).toBe(true);
    expect(isGameState({ type: 'gameFull' })).toBe(false);
  });
});

describe('isTerminalStatus', () => {
  it('treats "started" as non-terminal', () => {
    expect(isTerminalStatus('started')).toBe(false);
  });

  it('treats game-over statuses as terminal', () => {
    for (const status of ['mate', 'resign', 'draw', 'stalemate', 'outoftime', 'timeout', 'aborted', 'noStart']) {
      expect(isTerminalStatus(status)).toBe(true);
    }
  });
});

describe('active game persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(getActiveGame()).toBeNull();
  });

  it('round-trips the active game through localStorage', () => {
    const active: LichessActive = {
      gameId: 'abc123',
      accountId: 'local-uuid',
      color: 'white',
    };
    persistActiveGame(active);
    expect(getActiveGame()).toEqual(active);
  });

  it('clearActiveGame removes the stored value', () => {
    persistActiveGame({ gameId: 'x', accountId: 'y', color: 'black' });
    clearActiveGame();
    expect(getActiveGame()).toBeNull();
  });
});
