// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { logger } from '../logger';

const CHESSCOM_BASE = 'https://api.chess.com/pub';

/** Fixed backoff before the single 429 retry — chess.com does not document a Retry-After format. */
const RETRY_AFTER_MS = 2000;

export class ChessComError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ChessComError';
  }
}

export interface ChessComPlayerResult {
  username: string;
  rating: number;
  result: string;
}

export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  time_class: string;
  rules: string;
  white: ChessComPlayerResult;
  black: ChessComPlayerResult;
  eco?: string;
}

interface ArchivesResponse {
  archives: string[];
}

interface GamesResponse {
  games: ChessComGame[];
}

async function getJson<T>(url: string): Promise<T> {
  let res = await fetch(url);
  if (res.status === 429) {
    logger.warn('chess.com 429, retrying after', RETRY_AFTER_MS, 'ms');
    await new Promise<void>((resolve) => setTimeout(resolve, RETRY_AFTER_MS));
    res = await fetch(url);
  }
  if (res.status === 404) {
    throw new ChessComError(404, `Not found: ${url}`);
  }
  if (!res.ok) {
    throw new ChessComError(res.status, `HTTP ${res.status}: ${url}`);
  }
  return res.json() as Promise<T>;
}

/**
 * List monthly archive URLs for a chess.com username, oldest first.
 * Throws ChessComError(404) if the username does not exist.
 */
export async function getArchives(username: string): Promise<string[]> {
  const url = `${CHESSCOM_BASE}/player/${encodeURIComponent(username.toLowerCase())}/games/archives`;
  const data = await getJson<ArchivesResponse>(url);
  return data.archives;
}

/** Fetch all games in a single monthly archive. */
export async function getArchiveGames(archiveUrl: string): Promise<ChessComGame[]> {
  const data = await getJson<GamesResponse>(archiveUrl);
  return data.games;
}
