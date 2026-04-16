// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect } from 'vitest';
import { classifyTimeControl, QUICK_SETUPS } from './time-control';

describe('classifyTimeControl', () => {
  it('classifies bullet (1+0, estimate 60)', () => {
    expect(classifyTimeControl({ initialSec: 60, incrementSec: 0 })).toBe('bullet');
  });

  it('classifies bullet (2+1, estimate 160)', () => {
    expect(classifyTimeControl({ initialSec: 120, incrementSec: 1 })).toBe('bullet');
  });

  it('classifies blitz (3+0, estimate 180)', () => {
    expect(classifyTimeControl({ initialSec: 180, incrementSec: 0 })).toBe('blitz');
  });

  it('classifies blitz (5+3, estimate 420)', () => {
    expect(classifyTimeControl({ initialSec: 300, incrementSec: 3 })).toBe('blitz');
  });

  it('classifies rapid (10+0, estimate 600)', () => {
    expect(classifyTimeControl({ initialSec: 600, incrementSec: 0 })).toBe('rapid');
  });

  it('classifies rapid (15+10, estimate 1300)', () => {
    expect(classifyTimeControl({ initialSec: 900, incrementSec: 10 })).toBe('rapid');
  });

  it('classifies classical (30+0, estimate 1800)', () => {
    expect(classifyTimeControl({ initialSec: 1800, incrementSec: 0 })).toBe('classical');
  });

  it('classifies correspondence (days per move)', () => {
    expect(classifyTimeControl({ initialSec: 86400 * 3, incrementSec: 0 })).toBe('correspondence');
  });
});

describe('QUICK_SETUPS', () => {
  it('has at least one entry', () => {
    expect(QUICK_SETUPS.length).toBeGreaterThan(0);
  });

  it('each entry has a label and tc', () => {
    for (const s of QUICK_SETUPS) {
      expect(typeof s.label).toBe('string');
      expect(typeof s.tc.initialSec).toBe('number');
      expect(typeof s.tc.incrementSec).toBe('number');
    }
  });
});
