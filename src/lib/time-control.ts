// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export type TimeControlBucket =
  | 'bullet'
  | 'blitz'
  | 'rapid'
  | 'classical'
  | 'correspondence';

export interface TimeControl {
  initialSec: number;
  incrementSec: number;
}

/**
 * Classify a time control into a named bucket using the estimated total game
 * duration (initialSec + 40 * incrementSec), matching standard FIDE thresholds.
 */
export function classifyTimeControl(tc: TimeControl): TimeControlBucket {
  const estimate = tc.initialSec + 40 * tc.incrementSec;
  if (estimate < 180) return 'bullet';
  if (estimate < 480) return 'blitz';
  if (estimate < 1500) return 'rapid';
  if (estimate < 7200) return 'classical';
  return 'correspondence';
}

/** Common time controls shown in QuickSetup (6 presets: 3 rapid, 3 classical). */
export const QUICK_SETUPS: { label: string; tc: TimeControl }[] = [
  { label: '10+0',  tc: { initialSec:  600, incrementSec:  0 } },
  { label: '10+5',  tc: { initialSec:  600, incrementSec:  5 } },
  { label: '15+10', tc: { initialSec:  900, incrementSec: 10 } },
  { label: '30+0',  tc: { initialSec: 1800, incrementSec:  0 } },
  { label: '30+20', tc: { initialSec: 1800, incrementSec: 20 } },
  { label: '45+0',  tc: { initialSec: 2700, incrementSec:  0 } },
];
