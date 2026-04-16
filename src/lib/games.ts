// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Store } from './db';
import { DB_GAMES } from './config';
import type { TimeControl, TimeControlBucket } from './time-control';
import type { GameResult } from './engine';
import type { Network } from './accounts';

export type { GameResult };

export interface Game {
  id: string;
  source: Network;
  sourceGameId: string | null;
  whiteAccountId: string;
  blackAccountId: string;
  pgn: string;
  result: GameResult;
  timeControlBucket: TimeControlBucket;
  timeControlRaw: TimeControl | null;
  openingEco: string | null;
  playedAt: number;
  importedAt: number;
}

const store = new Store<Game>(DB_GAMES);

/** Persist a new or updated game record. */
export async function saveGame(game: Game): Promise<void> {
  await store.put(game);
}

/** Retrieve all games, unsorted. */
export async function getAllGames(): Promise<Game[]> {
  return store.getAll();
}

/** Retrieve a single game by id. */
export async function getGame(id: string): Promise<Game | undefined> {
  return store.get(id);
}

/** Delete a game by id. */
export async function deleteGame(id: string): Promise<void> {
  await store.delete(id);
}

/** Clear all games (used in tests). */
export async function clearAll(): Promise<void> {
  await store.clear();
}
