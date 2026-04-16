// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  parsePgnHeaders,
  splitPgn,
  parsePgnTimeControl,
  parsePgnDate,
  extractGameId,
  importUserGames,
} from './history';
import { clearAll } from '../games';
import type { Account } from '../accounts';

const SAMPLE_PGN_1 = `[Event "Rated Rapid game"]
[Site "https://lichess.org/abc123"]
[Date "2024.01.15"]
[White "alice"]
[Black "bob"]
[Result "1-0"]
[UTCDate "2024.01.15"]
[UTCTime "14:30:00"]
[TimeControl "600+0"]
[ECO "C00"]

1. e4 e5 2. Nf3 Nc6 1-0`;

const SAMPLE_PGN_2 = `[Event "Rated Rapid game"]
[Site "https://lichess.org/def456"]
[Date "2024.01.16"]
[White "bob"]
[Black "alice"]
[Result "0-1"]
[UTCDate "2024.01.16"]
[UTCTime "10:00:00"]
[TimeControl "600+0"]
[ECO "D30"]

1. d4 d5 2. c4 0-1`;

describe('parsePgnHeaders', () => {
  it('extracts all tag values', () => {
    const headers = parsePgnHeaders(SAMPLE_PGN_1);
    expect(headers.get('White')).toBe('alice');
    expect(headers.get('Black')).toBe('bob');
    expect(headers.get('Result')).toBe('1-0');
    expect(headers.get('TimeControl')).toBe('600+0');
    expect(headers.get('ECO')).toBe('C00');
  });
});

describe('splitPgn', () => {
  it('returns a single game for a single PGN', () => {
    const games = splitPgn(SAMPLE_PGN_1);
    expect(games).toHaveLength(1);
  });

  it('splits two games correctly', () => {
    const combined = SAMPLE_PGN_1 + '\n\n' + SAMPLE_PGN_2;
    const games = splitPgn(combined);
    expect(games).toHaveLength(2);
    expect(games[0]).toContain('abc123');
    expect(games[1]).toContain('def456');
  });

  it('handles empty input', () => {
    expect(splitPgn('')).toHaveLength(0);
    expect(splitPgn('   \n  ')).toHaveLength(0);
  });
});

describe('parsePgnTimeControl', () => {
  it('parses standard increment format', () => {
    expect(parsePgnTimeControl('600+0')).toEqual({ initialSec: 600, incrementSec: 0 });
    expect(parsePgnTimeControl('180+2')).toEqual({ initialSec: 180, incrementSec: 2 });
  });

  it('returns null for unlimited / unknown', () => {
    expect(parsePgnTimeControl('-')).toBeNull();
    expect(parsePgnTimeControl('?')).toBeNull();
  });
});

describe('parsePgnDate', () => {
  it('produces a valid timestamp', () => {
    const ts = parsePgnDate('2024.01.15', '14:30:00');
    expect(ts).toBe(new Date('2024-01-15T14:30:00Z').getTime());
  });

  it('falls back to Date.now() for invalid input', () => {
    const before = Date.now();
    const ts = parsePgnDate('invalid', 'also-invalid');
    const after = Date.now();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

describe('extractGameId', () => {
  it('extracts the game ID from a lichess site URL', () => {
    expect(extractGameId('https://lichess.org/abc123')).toBe('abc123');
    expect(extractGameId('https://lichess.org/q7zvsd8f')).toBe('q7zvsd8f');
  });

  it('returns null for empty string', () => {
    expect(extractGameId('')).toBeNull();
  });
});

describe('importUserGames', () => {
  const account: Account = {
    id: 'local-alice-id',
    network: 'lichess',
    displayName: 'alice',
    handle: 'alice',
    credentials: { accessToken: 'tok', refreshToken: null, expiresAt: null },
    createdAt: Date.now(),
  };

  beforeEach(async () => {
    await clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('imports games from a PGN response', async () => {
    const combined = SAMPLE_PGN_1 + '\n\n' + SAMPLE_PGN_2;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(combined, {
        status: 200,
        headers: { 'Content-Type': 'application/x-chess-pgn' },
      })
    );

    const count = await importUserGames(account);
    expect(count).toBe(2);
  });

  it('is idempotent — re-import skips existing games', async () => {
    const combined = SAMPLE_PGN_1 + '\n\n' + SAMPLE_PGN_2;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(combined, { status: 200 })
    );

    const first = await importUserGames(account);
    expect(first).toBe(2);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(combined, { status: 200 })
    );
    const second = await importUserGames(account);
    expect(second).toBe(0);
  });

  it('sets our account as whiteAccountId when we are white', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(SAMPLE_PGN_1, { status: 200 })
    );

    const { getAllGames } = await import('../games');
    await importUserGames(account);
    const games = await getAllGames();
    expect(games[0].whiteAccountId).toBe(account.id);
    expect(games[0].blackAccountId).toBe('lichess:bob');
  });

  it('throws when credentials are missing', async () => {
    const noCredentials: Account = { ...account, credentials: null };
    await expect(importUserGames(noCredentials)).rejects.toThrow();
  });
});
