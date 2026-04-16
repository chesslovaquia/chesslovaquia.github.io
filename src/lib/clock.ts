// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import type { TimeControl } from './time-control';

export interface ClockState {
  white: number;   // ms remaining
  black: number;   // ms remaining
  lastTickAt: number;  // Date.now() at last tick
}

/** Create an initial clock from a time control. */
export function createClock(tc: TimeControl): ClockState {
  const ms = tc.initialSec * 1000;
  return { white: ms, black: ms, lastTickAt: Date.now() };
}

/**
 * Deduct elapsed time from `side`'s clock and update lastTickAt.
 * Returns a new ClockState (pure — does not mutate).
 */
export function tick(state: ClockState, side: 'white' | 'black', now: number): ClockState {
  const elapsed = now - state.lastTickAt;
  const remaining = Math.max(0, state[side] - elapsed);
  return { ...state, [side]: remaining, lastTickAt: now };
}

/**
 * Add the increment to `side`'s clock after they complete a move.
 * Returns a new ClockState (pure — does not mutate).
 */
export function applyIncrement(
  state: ClockState,
  side: 'white' | 'black',
  tc: TimeControl,
): ClockState {
  if (tc.incrementSec === 0) return state;
  return { ...state, [side]: state[side] + tc.incrementSec * 1000 };
}

/** True if `side`'s clock has hit zero. */
export function isExpired(state: ClockState, side: 'white' | 'black'): boolean {
  return state[side] <= 0;
}

/**
 * Format milliseconds as a display string.
 * >= 1 minute: "M:SS"   e.g. "5:03"
 * < 1 minute:  "SS.t"   e.g. "08.3" (one decimal for urgency)
 * < 10 seconds: "S.t"   e.g. "8.3"
 */
export function formatMs(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSec = ms / 1000;
  if (totalSec >= 60) {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  const tenths = Math.floor(totalSec * 10) % 10;
  const s = Math.floor(totalSec);
  return `${s}.${tenths}`;
}
