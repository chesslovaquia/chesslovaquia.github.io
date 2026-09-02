// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parsePgnTag, parseTimeControl, importUserGames } from './import';
import { clearAll, getAllGames } from '../games';
import type { Account } from '../accounts';
import type { ChessComGame } from './client';

const ARCHIVE_JAN = 'https://api.chess.com/pub/player/aliceplays/games/2024/01';
const ARCHIVE_FEB = 'https://api.chess.com/pub/player/aliceplays/games/2024/02';
const ARCHIVES_URL = 'https://api.chess.com/pub/player/aliceplays/games/archives';

function pgn(tags: Record<string, string>, moves: string): string {
  const header = Object.entries(tags)
    .map(([k, v]) => `[${k} "${v}"]`)
    .join('\n');
  return `${header}\n\n${moves}`;
}

function game(overrides: Partial<ChessComGame> & { pgn: string }): ChessComGame {
  return {
    url: 'https://www.chess.com/game/live/1',
    time_control: '600',
    end_time: 1700000000,
    rated: true,
    time_class: 'rapid',
    rules: 'chess',
    white: { username: 'aliceplays', rating: 1500, result: 'win' },
    black: { username: 'bob99', rating: 1490, result: 'checkmated' },
    ...overrides,
  };
}

const GAME_1 = game({
  url: 'https://www.chess.com/game/live/1',
  time_control: '600',
  end_time: 1700000000,
  pgn: pgn(
    { White: 'aliceplays', Black: 'bob99', Result: '1-0', ECO: 'C50' },
    '1. e4 e5 2. Bc4 1-0'
  ),
});

const GAME_2 = game({
  url: 'https://www.chess.com/game/live/2',
  time_control: '180+2',
  end_time: 1700003600,
  white: { username: 'bob99', rating: 1490, result: 'checkmated' },
  black: { username: 'AlicePlays', rating: 1500, result: 'win' },
  pgn: pgn(
    { White: 'bob99', Black: 'AlicePlays', Result: '0-1', ECO: 'B01' },
    '1. e4 d5 0-1'
  ),
});

const GAME_ONGOING = game({
  url: 'https://www.chess.com/game/live/3',
  pgn: pgn({ White: 'aliceplays', Black: 'bob99', Result: '*' }, '1. e4'),
});

const GAME_DAILY = game({
  url: 'https://www.chess.com/game/daily/9',
  time_control: '1/172800',
  time_class: 'daily',
  end_time: 1702000000,
  pgn: pgn(
    { White: 'aliceplays', Black: 'carol', Result: '1/2-1/2', ECO: 'D02' },
    '1. d4 d5 1/2-1/2'
  ),
});

function mockFetch(archives: Record<string, ChessComGame[]>) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url === ARCHIVES_URL) {
      return new Response(JSON.stringify({ archives: Object.keys(archives) }), { status: 200 });
    }
    if (url in archives) {
      return new Response(JSON.stringify({ games: archives[url] }), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  });
}

describe('parsePgnTag', () => {
  it('extracts a tag value', () => {
    expect(parsePgnTag(GAME_1.pgn, 'Result')).toBe('1-0');
    expect(parsePgnTag(GAME_1.pgn, 'ECO')).toBe('C50');
  });

  it('returns null for a missing tag', () => {
    expect(parsePgnTag(GAME_1.pgn, 'Nonexistent')).toBeNull();
  });
});

describe('parseTimeControl', () => {
  it('parses a plain-seconds control with no increment', () => {
    expect(parseTimeControl('600')).toEqual({ initialSec: 600, incrementSec: 0 });
  });

  it('parses seconds+increment', () => {
    expect(parseTimeControl('180+2')).toEqual({ initialSec: 180, incrementSec: 2 });
  });

  it('returns null for the daily seconds-per-move format', () => {
    expect(parseTimeControl('1/172800')).toBeNull();
  });
});

describe('importUserGames', () => {
  const account: Account = {
    id: 'local-alice-id',
    network: 'chesscom',
    displayName: 'alice',
    handle: 'aliceplays',
    credentials: null,
    createdAt: Date.now(),
  };

  beforeEach(async () => {
    await clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('imports games across multiple monthly archives', async () => {
    mockFetch({ [ARCHIVE_JAN]: [GAME_1, GAME_2], [ARCHIVE_FEB]: [GAME_DAILY] });
    const count = await importUserGames(account);
    expect(count).toBe(3);
  });

  it('is idempotent — re-import skips existing games', async () => {
    mockFetch({ [ARCHIVE_JAN]: [GAME_1, GAME_2] });
    const first = await importUserGames(account);
    expect(first).toBe(2);

    mockFetch({ [ARCHIVE_JAN]: [GAME_1, GAME_2] });
    const second = await importUserGames(account);
    expect(second).toBe(0);
  });

  it('skips ongoing games (Result "*")', async () => {
    mockFetch({ [ARCHIVE_JAN]: [GAME_ONGOING] });
    const count = await importUserGames(account);
    expect(count).toBe(0);
  });

  it('maps our account to whiteAccountId/blackAccountId case-insensitively, opponent to a pseudo-id', async () => {
    mockFetch({ [ARCHIVE_JAN]: [GAME_1, GAME_2] });
    await importUserGames(account);
    const games = await getAllGames();

    const g1 = games.find((g) => g.sourceGameId === GAME_1.url)!;
    expect(g1.whiteAccountId).toBe(account.id);
    expect(g1.blackAccountId).toBe('chesscom:bob99');

    const g2 = games.find((g) => g.sourceGameId === GAME_2.url)!;
    expect(g2.whiteAccountId).toBe('chesscom:bob99');
    expect(g2.blackAccountId).toBe(account.id);
  });

  it('buckets a daily game as correspondence with null timeControlRaw', async () => {
    mockFetch({ [ARCHIVE_JAN]: [GAME_DAILY] });
    await importUserGames(account);
    const games = await getAllGames();
    expect(games[0].timeControlBucket).toBe('correspondence');
    expect(games[0].timeControlRaw).toBeNull();
  });

  it('derives playedAt from end_time', async () => {
    mockFetch({ [ARCHIVE_JAN]: [GAME_1] });
    await importUserGames(account);
    const games = await getAllGames();
    expect(games[0].playedAt).toBe(GAME_1.end_time * 1000);
  });

  it('stores source and sourceGameId, tagged chesscom', async () => {
    mockFetch({ [ARCHIVE_JAN]: [GAME_1] });
    await importUserGames(account);
    const games = await getAllGames();
    expect(games[0].source).toBe('chesscom');
    expect(games[0].sourceGameId).toBe(GAME_1.url);
    expect(games[0].openingEco).toBe('C50');
  });

  it('throws when handle is missing', async () => {
    const noHandle: Account = { ...account, handle: null };
    await expect(importUserGames(noHandle)).rejects.toThrow();
  });
});
