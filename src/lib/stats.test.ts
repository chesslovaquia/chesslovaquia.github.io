// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect } from 'vitest';
import {
  outcomeFor,
  tally,
  perspectiveColor,
  sideForAccount,
  toPerspective,
  recordForAccount,
  recordByBucket,
  recordByColor,
  recordByNetwork,
  openingFrequency,
  byDayOfWeek,
  byHourOfDay,
  rollingWindow,
} from './stats';
import type { PerspectiveGame } from './stats';
import type { Game } from './games';
import { OTB_USER_ID } from './config';

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: overrides.id ?? 'g1',
    source: 'otb',
    sourceGameId: null,
    whiteAccountId: OTB_USER_ID,
    blackAccountId: 'clvq-otb-guest',
    pgn: '1. e4 e5',
    result: '1-0',
    timeControlBucket: 'rapid',
    timeControlRaw: { initialSec: 600, incrementSec: 0 },
    openingEco: null,
    playedAt: new Date('2026-01-01T12:00:00').getTime(), // Thursday
    importedAt: Date.now(),
    ...overrides,
  };
}

describe('outcomeFor', () => {
  it('returns null for an aborted game', () => {
    expect(outcomeFor(makeGame({ result: '*' }), 'white')).toBeNull();
  });

  it('returns draw for a draw regardless of color', () => {
    expect(outcomeFor(makeGame({ result: '1/2-1/2' }), 'white')).toBe('draw');
    expect(outcomeFor(makeGame({ result: '1/2-1/2' }), 'black')).toBe('draw');
  });

  it('returns win/loss based on color vs result', () => {
    expect(outcomeFor(makeGame({ result: '1-0' }), 'white')).toBe('win');
    expect(outcomeFor(makeGame({ result: '1-0' }), 'black')).toBe('loss');
    expect(outcomeFor(makeGame({ result: '0-1' }), 'black')).toBe('win');
    expect(outcomeFor(makeGame({ result: '0-1' }), 'white')).toBe('loss');
  });
});

describe('tally', () => {
  it('counts wins, losses, draws and aborted games separately', () => {
    const pgames: PerspectiveGame[] = [
      { game: makeGame({ result: '1-0' }), color: 'white' },
      { game: makeGame({ result: '0-1' }), color: 'white' },
      { game: makeGame({ result: '1/2-1/2' }), color: 'white' },
      { game: makeGame({ result: '*' }), color: 'white' },
    ];
    const record = tally(pgames);
    expect(record).toEqual({ wins: 1, losses: 1, draws: 1, aborted: 1, total: 4, winRate: 1 / 3 });
  });

  it('returns zeroed record with 0 winRate for an empty list', () => {
    expect(tally([])).toEqual({ wins: 0, losses: 0, draws: 0, aborted: 0, total: 0, winRate: 0 });
  });
});

describe('perspectiveColor', () => {
  it('attributes OTB games to the fixed User account, not Guest', () => {
    const game = makeGame({ source: 'otb', whiteAccountId: OTB_USER_ID, blackAccountId: 'clvq-otb-guest' });
    expect(perspectiveColor(game, new Set())).toBe('white');
    const flipped = makeGame({ source: 'otb', whiteAccountId: 'clvq-otb-guest', blackAccountId: OTB_USER_ID });
    expect(perspectiveColor(flipped, new Set())).toBe('black');
  });

  it('attributes online games to whichever side is one of our own accounts', () => {
    const game = makeGame({ source: 'lichess', whiteAccountId: 'acc-1', blackAccountId: 'lichess:opponent' });
    expect(perspectiveColor(game, new Set(['acc-1']))).toBe('white');
    const flipped = makeGame({ source: 'lichess', whiteAccountId: 'lichess:opponent', blackAccountId: 'acc-1' });
    expect(perspectiveColor(flipped, new Set(['acc-1']))).toBe('black');
  });
});

describe('sideForAccount', () => {
  it('returns the matching side or null', () => {
    const game = makeGame({ whiteAccountId: 'a', blackAccountId: 'b' });
    expect(sideForAccount(game, 'a')).toBe('white');
    expect(sideForAccount(game, 'b')).toBe('black');
    expect(sideForAccount(game, 'c')).toBeNull();
  });
});

describe('toPerspective', () => {
  it('drops games the given account did not play', () => {
    const games = [
      makeGame({ id: 'g1', whiteAccountId: 'a', blackAccountId: 'b' }),
      makeGame({ id: 'g2', whiteAccountId: 'x', blackAccountId: 'y' }),
    ];
    const result = toPerspective(games, new Set(), 'a');
    expect(result).toEqual([{ game: games[0], color: 'white' }]);
  });

  it('falls back to the ownAccountIds heuristic when accountId is null', () => {
    const games = [makeGame({ source: 'lichess', whiteAccountId: 'acc-1', blackAccountId: 'lichess:opp' })];
    const result = toPerspective(games, new Set(['acc-1']), null);
    expect(result).toEqual([{ game: games[0], color: 'white' }]);
  });
});

describe('recordForAccount', () => {
  it('tallies a single account across games it played', () => {
    const games = [
      makeGame({ id: 'g1', whiteAccountId: 'a', blackAccountId: 'b', result: '1-0' }),
      makeGame({ id: 'g2', whiteAccountId: 'b', blackAccountId: 'a', result: '0-1' }),
      makeGame({ id: 'g3', whiteAccountId: 'x', blackAccountId: 'y', result: '1-0' }),
    ];
    expect(recordForAccount(games, 'a').wins).toBe(2);
    expect(recordForAccount(games, 'a').total).toBe(2);
  });
});

describe('recordByBucket', () => {
  it('groups by time control bucket', () => {
    const pgames: PerspectiveGame[] = [
      { game: makeGame({ timeControlBucket: 'bullet', result: '1-0' }), color: 'white' },
      { game: makeGame({ timeControlBucket: 'rapid', result: '0-1' }), color: 'white' },
    ];
    const byBucket = recordByBucket(pgames);
    expect(byBucket.get('bullet')?.wins).toBe(1);
    expect(byBucket.get('rapid')?.losses).toBe(1);
    expect(byBucket.has('blitz')).toBe(false);
  });
});

describe('recordByColor', () => {
  it('always returns both white and black keys, zeroed when absent', () => {
    const pgames: PerspectiveGame[] = [{ game: makeGame({ result: '1-0' }), color: 'white' }];
    const byColor = recordByColor(pgames);
    expect(byColor.white.wins).toBe(1);
    expect(byColor.black).toEqual({ wins: 0, losses: 0, draws: 0, aborted: 0, total: 0, winRate: 0 });
  });
});

describe('recordByNetwork', () => {
  it('groups by source network', () => {
    const pgames: PerspectiveGame[] = [
      { game: makeGame({ source: 'otb', result: '1-0' }), color: 'white' },
      { game: makeGame({ source: 'chesscom', result: '0-1' }), color: 'white' },
    ];
    const byNetwork = recordByNetwork(pgames);
    expect(byNetwork.get('otb')?.wins).toBe(1);
    expect(byNetwork.get('chesscom')?.losses).toBe(1);
  });
});

describe('openingFrequency', () => {
  it('buckets missing ECO codes as unknown and sorts by total descending', () => {
    const pgames: PerspectiveGame[] = [
      { game: makeGame({ openingEco: 'C50' }), color: 'white' },
      { game: makeGame({ openingEco: 'C50' }), color: 'white' },
      { game: makeGame({ openingEco: null }), color: 'white' },
    ];
    const openings = openingFrequency(pgames);
    expect(openings[0]).toEqual({ eco: 'C50', record: expect.objectContaining({ total: 2 }) });
    expect(openings[1]).toEqual({ eco: 'unknown', record: expect.objectContaining({ total: 1 }) });
  });
});

describe('byDayOfWeek', () => {
  it('returns 7 buckets indexed by local day of week', () => {
    const thursday = new Date('2026-01-01T12:00:00').getTime();
    const pgames: PerspectiveGame[] = [{ game: makeGame({ playedAt: thursday, result: '1-0' }), color: 'white' }];
    const days = byDayOfWeek(pgames);
    expect(days.length).toBe(7);
    expect(days[4].wins).toBe(1); // Thursday
    expect(days[0].total).toBe(0);
  });
});

describe('byHourOfDay', () => {
  it('returns 24 buckets indexed by local hour', () => {
    const pgames: PerspectiveGame[] = [{ game: makeGame({ result: '1-0' }), color: 'white' }]; // 12:00 local
    const hours = byHourOfDay(pgames);
    expect(hours.length).toBe(24);
    expect(hours[12].wins).toBe(1);
  });
});

describe('rollingWindow', () => {
  it('tallies only the most recent N games by playedAt', () => {
    const pgames: PerspectiveGame[] = [
      { game: makeGame({ id: 'old', playedAt: 1000, result: '0-1' }), color: 'white' },
      { game: makeGame({ id: 'new', playedAt: 2000, result: '1-0' }), color: 'white' },
    ];
    const record = rollingWindow(pgames, 1);
    expect(record.wins).toBe(1);
    expect(record.losses).toBe(0);
    expect(record.total).toBe(1);
  });

  it('is tolerant of a window larger than the data', () => {
    const pgames: PerspectiveGame[] = [{ game: makeGame({ result: '1-0' }), color: 'white' }];
    expect(rollingWindow(pgames, 100).total).toBe(1);
  });
});
