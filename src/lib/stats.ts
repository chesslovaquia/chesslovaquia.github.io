// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import type { Game } from './games';
import type { TimeControlBucket } from './time-control';
import type { Network } from './accounts';
import { OTB_USER_ID } from './config';

export type Color = 'white' | 'black';
export type Outcome = 'win' | 'loss' | 'draw';

/** A game paired with the color the stats subject played, for one perspective. */
export interface PerspectiveGame {
  game: Game;
  color: Color;
}

export interface RecordStats {
  wins: number;
  losses: number;
  draws: number;
  aborted: number;
  total: number; // wins + losses + draws + aborted
  winRate: number; // wins / (wins + losses + draws), 0 when nothing decided
}

/** Outcome for the given color, or null for an unfinished/aborted game ('*'). */
export function outcomeFor(game: Game, color: Color): Outcome | null {
  if (game.result === '*') return null;
  if (game.result === '1/2-1/2') return 'draw';
  const whiteWon = game.result === '1-0';
  return (color === 'white') === whiteWon ? 'win' : 'loss';
}

/** Aggregate a set of perspective games into win/loss/draw/aborted totals. */
export function tally(pgames: PerspectiveGame[]): RecordStats {
  let wins = 0, losses = 0, draws = 0, aborted = 0;
  for (const { game, color } of pgames) {
    const outcome = outcomeFor(game, color);
    if (outcome === null) aborted++;
    else if (outcome === 'win') wins++;
    else if (outcome === 'loss') losses++;
    else draws++;
  }
  const decided = wins + losses + draws;
  return {
    wins, losses, draws, aborted,
    total: decided + aborted,
    winRate: decided > 0 ? wins / decided : 0,
  };
}

/**
 * Which color the local player is presumed to have played, absent an explicit
 * account filter: OTB games are attributed to the fixed User account (not
 * Guest); online games are attributed to whichever side is one of our own
 * accounts. Mirrors History.svelte's playerColor().
 */
export function perspectiveColor(game: Game, ownAccountIds: Set<string>): Color {
  if (game.source === 'otb') return game.whiteAccountId === OTB_USER_ID ? 'white' : 'black';
  return ownAccountIds.has(game.whiteAccountId) ? 'white' : 'black';
}

/** The color a specific account played in a game, or null if it wasn't in it. */
export function sideForAccount(game: Game, accountId: string): Color | null {
  if (game.whiteAccountId === accountId) return 'white';
  if (game.blackAccountId === accountId) return 'black';
  return null;
}

/**
 * Build the perspective list for a set of games. When accountId is given,
 * every game is viewed from that specific account's side (games where it
 * didn't play are dropped). Otherwise falls back to the ownAccountIds
 * heuristic via perspectiveColor.
 */
export function toPerspective(
  games: Game[],
  ownAccountIds: Set<string>,
  accountId: string | null
): PerspectiveGame[] {
  if (accountId === null) {
    return games.map((game) => ({ game, color: perspectiveColor(game, ownAccountIds) }));
  }
  const result: PerspectiveGame[] = [];
  for (const game of games) {
    const color = sideForAccount(game, accountId);
    if (color !== null) result.push({ game, color });
  }
  return result;
}

/** Record for one specific account, viewed from its own side of each game. */
export function recordForAccount(games: Game[], accountId: string): RecordStats {
  return tally(toPerspective(games, new Set(), accountId));
}

export function recordByBucket(pgames: PerspectiveGame[]): Map<TimeControlBucket, RecordStats> {
  return groupAndTally(pgames, (p) => p.game.timeControlBucket);
}

export function recordByColor(pgames: PerspectiveGame[]): Record<Color, RecordStats> {
  const map = groupAndTally(pgames, (p) => p.color);
  return {
    white: map.get('white') ?? tally([]),
    black: map.get('black') ?? tally([]),
  };
}

export function recordByNetwork(pgames: PerspectiveGame[]): Map<Network, RecordStats> {
  return groupAndTally(pgames, (p) => p.game.source);
}

export interface OpeningStat {
  eco: string; // 'unknown' when the game has no ECO code
  record: RecordStats;
}

/** Opening frequency by ECO code, sorted by total games descending. */
export function openingFrequency(pgames: PerspectiveGame[]): OpeningStat[] {
  const map = groupAndTally(pgames, (p) => p.game.openingEco ?? 'unknown');
  return [...map.entries()]
    .map(([eco, record]) => ({ eco, record }))
    .sort((a, b) => b.record.total - a.record.total);
}

/** Record per day of week, index 0 = Sunday, using local time. */
export function byDayOfWeek(pgames: PerspectiveGame[]): RecordStats[] {
  const buckets: PerspectiveGame[][] = Array.from({ length: 7 }, () => []);
  for (const p of pgames) buckets[new Date(p.game.playedAt).getDay()].push(p);
  return buckets.map(tally);
}

/** Record per hour of day (0-23), using local time. */
export function byHourOfDay(pgames: PerspectiveGame[]): RecordStats[] {
  const buckets: PerspectiveGame[][] = Array.from({ length: 24 }, () => []);
  for (const p of pgames) buckets[new Date(p.game.playedAt).getHours()].push(p);
  return buckets.map(tally);
}

/** Record over the most recent `size` games by playedAt (fewer if not enough games). */
export function rollingWindow(pgames: PerspectiveGame[], size: number): RecordStats {
  const sorted = [...pgames].sort((a, b) => b.game.playedAt - a.game.playedAt);
  return tally(sorted.slice(0, size));
}

function groupAndTally<K>(pgames: PerspectiveGame[], keyOf: (p: PerspectiveGame) => K): Map<K, RecordStats> {
  const groups = new Map<K, PerspectiveGame[]>();
  for (const p of pgames) {
    const key = keyOf(p);
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  }
  return new Map([...groups.entries()].map(([key, list]) => [key, tally(list)]));
}
