// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import type { Account } from '../accounts';
import { getAllGames, saveGame } from '../games';
import type { Game } from '../games';
import { classifyTimeControl } from '../time-control';
import type { TimeControl } from '../time-control';
import type { GameResult } from '../engine';
import { logger } from '../logger';

const LICHESS_BASE = 'https://lichess.org';

// ---------------------------------------------------------------------------
// PGN parsing helpers
// ---------------------------------------------------------------------------

/** Extract PGN header tag values from a single game PGN string. */
export function parsePgnHeaders(pgn: string): Map<string, string> {
  const headers = new Map<string, string>();
  const re = /^\[(\w+)\s+"([^"]*)"\]/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pgn)) !== null) {
    headers.set(m[1], m[2]);
  }
  return headers;
}

/** Split a multi-game PGN text into individual game strings. */
export function splitPgn(raw: string): string[] {
  const games: string[] = [];
  const lines = raw.split('\n');
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith('[Event ') && current.length > 0) {
      const game = current.join('\n').trim();
      if (game) games.push(game);
      current = [line];
    } else {
      current.push(line);
    }
  }
  const last = current.join('\n').trim();
  if (last) games.push(last);
  return games;
}

/**
 * Parse a lichess TimeControl PGN tag (e.g. "600+0", "180+2", "-")
 * into a TimeControl object. Returns null for unlimited/unknown.
 */
export function parsePgnTimeControl(tc: string): TimeControl | null {
  const m = /^(\d+)\+(\d+)$/.exec(tc);
  if (!m) return null;
  return { initialSec: parseInt(m[1], 10), incrementSec: parseInt(m[2], 10) };
}

/**
 * Parse PGN UTCDate ("2024.01.15") and UTCTime ("14:30:00") into a UTC timestamp.
 * Returns Date.now() if parsing fails.
 */
export function parsePgnDate(date: string, time: string): number {
  const normalized = `${date.replace(/\./g, '-')}T${time}Z`;
  const ts = Date.parse(normalized);
  return isNaN(ts) ? Date.now() : ts;
}

/** Extract the lichess game ID from a Site header value like "https://lichess.org/q7zvsd8f". */
export function extractGameId(site: string): string | null {
  const id = site.split('/').pop();
  return id && id.length > 0 ? id : null;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/**
 * Fetch and import finished games for a lichess account.
 * Idempotent: skips games whose sourceGameId is already stored.
 * Returns the number of games newly imported.
 */
export async function importUserGames(
  account: Account,
  options: { max?: number; since?: number } = {}
): Promise<number> {
  if (!account.handle || !account.credentials?.accessToken) {
    throw new Error('Account is missing lichess handle or credentials');
  }

  const params = new URLSearchParams({
    tags: 'true',
    clocks: 'false',
    opening: 'false',
    max: String(options.max ?? 300),
  });
  if (options.since !== undefined) {
    params.set('since', String(options.since));
  }

  const url = `${LICHESS_BASE}/api/games/user/${encodeURIComponent(account.handle)}?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${account.credentials.accessToken}`,
      Accept: 'application/x-chess-pgn',
    },
  });
  if (!res.ok) {
    throw new Error(`Lichess games fetch failed: ${res.status}`);
  }

  const raw = await res.text();
  if (!raw.trim()) return 0;

  // Pre-load existing lichess sourceGameIds to check idempotency
  const existing = await getAllGames();
  const existingIds = new Set(
    existing
      .filter((g) => g.source === 'lichess')
      .map((g) => g.sourceGameId)
  );

  const pgnGames = splitPgn(raw);
  let imported = 0;

  for (const pgn of pgnGames) {
    const headers = parsePgnHeaders(pgn);
    const site = headers.get('Site') ?? '';
    const sourceGameId = extractGameId(site);

    if (!sourceGameId || existingIds.has(sourceGameId)) continue;

    const result = headers.get('Result') as GameResult | undefined;
    if (!result || result === '*') continue; // incomplete game

    const whiteHandle = headers.get('White') ?? '';
    const blackHandle = headers.get('Black') ?? '';

    // Map handles to account IDs. Our account → account.id, opponent → pseudo-ID
    const whiteAccountId = whiteHandle === account.handle
      ? account.id
      : `lichess:${whiteHandle}`;
    const blackAccountId = blackHandle === account.handle
      ? account.id
      : `lichess:${blackHandle}`;

    const tcRaw = parsePgnTimeControl(headers.get('TimeControl') ?? '-');
    const utcDate = headers.get('UTCDate') ?? '';
    const utcTime = headers.get('UTCTime') ?? '00:00:00';
    const playedAt = parsePgnDate(utcDate, utcTime);

    const game: Game = {
      id: crypto.randomUUID(),
      source: 'lichess',
      sourceGameId,
      whiteAccountId,
      blackAccountId,
      pgn,
      result,
      timeControlBucket: tcRaw ? classifyTimeControl(tcRaw) : 'classical',
      timeControlRaw: tcRaw,
      openingEco: headers.get('ECO') ?? null,
      playedAt,
      importedAt: Date.now(),
    };

    await saveGame(game);
    existingIds.add(sourceGameId);
    imported++;
  }

  logger.debug('lichess history import done', imported, 'of', pgnGames.length);
  return imported;
}
