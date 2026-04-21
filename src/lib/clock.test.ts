// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect } from 'vitest';
import { createClock, tick, applyIncrement, isExpired, formatMs } from './clock';
import type { TimeControl } from './time-control';

const TC_5_0: TimeControl = { initialSec: 300, incrementSec: 0 };
const TC_3_2: TimeControl = { initialSec: 180, incrementSec: 2 };

describe('createClock', () => {
  it('initializes both sides to initialSec * 1000', () => {
    const c = createClock(TC_5_0);
    expect(c.white).toBe(300_000);
    expect(c.black).toBe(300_000);
  });
});

describe('tick', () => {
  it('deducts elapsed time from the active side', () => {
    const start = Date.now();
    const c = createClock(TC_5_0);
    const updated = tick(c, 'white', start + 2000);
    expect(updated.white).toBe(298_000);
    expect(updated.black).toBe(300_000);
  });

  it('deducts elapsed time from the black side', () => {
    const start = Date.now();
    const c = createClock(TC_5_0);
    const updated = tick(c, 'black', start + 3000);
    expect(updated.black).toBe(297_000);
    expect(updated.white).toBe(300_000);
  });

  it('does not go below zero', () => {
    const start = Date.now();
    const c = createClock(TC_5_0);
    const updated = tick(c, 'white', start + 999_999);
    expect(updated.white).toBe(0);
  });

  it('updates lastTickAt', () => {
    const start = Date.now();
    const c = createClock(TC_5_0);
    const now = start + 1000;
    const updated = tick(c, 'white', now);
    expect(updated.lastTickAt).toBe(now);
  });
});

describe('applyIncrement', () => {
  it('adds increment ms to the moved side', () => {
    const c = createClock(TC_3_2);
    const updated = applyIncrement(c, 'white', TC_3_2);
    expect(updated.white).toBe(180_000 + 2_000);
    expect(updated.black).toBe(180_000);
  });

  it('does nothing when increment is 0', () => {
    const c = createClock(TC_5_0);
    const updated = applyIncrement(c, 'white', TC_5_0);
    expect(updated.white).toBe(c.white);
  });
});

describe('isExpired', () => {
  it('returns true when clock is 0', () => {
    const c = { white: 0, black: 5000, lastTickAt: Date.now() };
    expect(isExpired(c, 'white')).toBe(true);
    expect(isExpired(c, 'black')).toBe(false);
  });

  it('returns false when clock is positive', () => {
    const c = createClock(TC_5_0);
    expect(isExpired(c, 'white')).toBe(false);
  });
});

describe('formatMs', () => {
  it('formats 0 as 0:00', () => {
    expect(formatMs(0)).toBe('0:00');
  });

  it('formats minutes correctly', () => {
    expect(formatMs(300_000)).toBe('5:00');
    expect(formatMs(63_000)).toBe('1:03');
    expect(formatMs(60_000)).toBe('1:00');
  });

  it('formats sub-minute with tenths', () => {
    expect(formatMs(8_300)).toBe('8.3');
    expect(formatMs(59_900)).toBe('59.9');
  });

  it('formats negative as 0:00', () => {
    expect(formatMs(-1)).toBe('0:00');
  });
});
