// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import type { Account } from '../accounts';
import { getAllGames, saveGame } from '../games';
import type { Game } from '../games';
import { classifyTimeControl } from '../time-control';
import type { TimeControl } from '../time-control';
import type { GameResult } from '../engine';
import { getArchives, getArchiveGames } from './client';
import type { ChessComGame } from './client';
import { logger } from '../logger';

// ---------------------------------------------------------------------------
// PGN parsing helpers
// ---------------------------------------------------------------------------

/** Extract a single PGN header tag value (e.g. "Result", "ECO") from a game PGN string. */
export function parsePgnTag(pgn: string, tag: string): string | null {
  const re = new RegExp(`^\\[${tag}\\s+"([^"]*)"\\]`, 'm');
  const m = re.exec(pgn);
  return m ? m[1] : null;
}

/**
 * Parse a chess.com TimeControl PGN/API tag ("600", "180+2") into a
 * TimeControl object. Returns null for the daily/correspondence format
 * ("1/172800" — seconds per move), which has no initial+increment shape.
 */
export function parseTimeControl(tc: string): TimeControl | null {
  const m = /^(\d+)(?:\+(\d+))?$/.exec(tc);
  if (!m) return null;
  return { initialSec: parseInt(m[1], 10), incrementSec: m[2] ? parseInt(m[2], 10) : 0 };
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/**
 * Fetch and import all games for a chess.com account across every monthly
 * archive. Idempotent: skips games whose sourceGameId (the game's chess.com
 * URL) is already stored. Returns the number of games newly imported.
 */
export async function importUserGames(account: Account): Promise<number> {
  if (!account.handle) {
    throw new Error('Account is missing chess.com handle');
  }
  const handle = account.handle.toLowerCase();

  const archives = await getArchives(handle);

  const existing = await getAllGames();
  const existingIds = new Set(
    existing.filter((g) => g.source === 'chesscom').map((g) => g.sourceGameId)
  );

  let imported = 0;

  for (const archiveUrl of archives) {
    const games = await getArchiveGames(archiveUrl);
    for (const g of games) {
      if (existingIds.has(g.url)) continue;

      const game = toGame(g, account.id, handle);
      if (!game) continue;

      await saveGame(game);
      existingIds.add(g.url);
      imported++;
    }
  }

  logger.debug('chess.com history import done', imported);
  return imported;
}

/** Convert a single chess.com archive game entry into a Game record, or null if incomplete. */
function toGame(g: ChessComGame, accountId: string, accountHandle: string): Game | null {
  const result = parsePgnTag(g.pgn, 'Result') as GameResult | null;
  if (!result || result === '*') return null; // incomplete/ongoing game

  const whiteAccountId = g.white.username.toLowerCase() === accountHandle
    ? accountId
    : `chesscom:${g.white.username}`;
  const blackAccountId = g.black.username.toLowerCase() === accountHandle
    ? accountId
    : `chesscom:${g.black.username}`;

  const timeControlRaw = parseTimeControl(g.time_control);
  const timeControlBucket = timeControlRaw ? classifyTimeControl(timeControlRaw) : 'correspondence';

  return {
    id: crypto.randomUUID(),
    source: 'chesscom',
    sourceGameId: g.url,
    whiteAccountId,
    blackAccountId,
    pgn: g.pgn,
    result,
    timeControlBucket,
    timeControlRaw,
    openingEco: parsePgnTag(g.pgn, 'ECO'),
    playedAt: g.end_time * 1000,
    importedAt: Date.now(),
  };
}
