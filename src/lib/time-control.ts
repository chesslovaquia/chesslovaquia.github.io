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

/** Common time controls shown in QuickSetup. */
export const QUICK_SETUPS: { label: string; tc: TimeControl }[] = [
  { label: '1+0', tc: { initialSec: 60, incrementSec: 0 } },
  { label: '2+1', tc: { initialSec: 120, incrementSec: 1 } },
  { label: '3+0', tc: { initialSec: 180, incrementSec: 0 } },
  { label: '3+2', tc: { initialSec: 180, incrementSec: 2 } },
  { label: '5+0', tc: { initialSec: 300, incrementSec: 0 } },
  { label: '5+3', tc: { initialSec: 300, incrementSec: 3 } },
  { label: '10+0', tc: { initialSec: 600, incrementSec: 0 } },
  { label: '15+10', tc: { initialSec: 900, incrementSec: 10 } },
  { label: '30+0', tc: { initialSec: 1800, incrementSec: 0 } },
];
