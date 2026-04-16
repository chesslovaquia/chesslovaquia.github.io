// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Store } from './db';
import { DB_GAME_STATE } from './config';
import type { TimeControl } from './time-control';

export interface ClockSnapshot {
  white: number;
  black: number;
  lastTickAt: number;
}

export interface GameState {
  id: string;           // always 'current' — single record
  gameId: string;
  moves: string[];      // SAN history
  fen: string;          // current position FEN
  clock: ClockSnapshot | null;
  orientation: 'white' | 'black';
  whiteAccountId: string;
  blackAccountId: string;
  timeControl: TimeControl | null;
}

const CURRENT_ID = 'current';

const store = new Store<GameState>(DB_GAME_STATE);

/** Persist the current in-progress game state. */
export async function saveGameState(state: Omit<GameState, 'id'>): Promise<void> {
  await store.put({ ...state, id: CURRENT_ID });
}

/** Load the in-progress game state, if any. */
export async function loadGameState(): Promise<GameState | undefined> {
  return store.get(CURRENT_ID);
}

/** Clear the in-progress game state (call when game finishes). */
export async function clearGameState(): Promise<void> {
  await store.delete(CURRENT_ID);
}
