// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LS_LICHESS_ACTIVE } from '../config';
import { reconnectingStream, streamNdjson } from './stream';
import type { LichessClient } from './client';
import type { TimeControl } from '../time-control';
import { logger } from '../logger';

// ---------------------------------------------------------------------------
// Lichess Board API event types
// ---------------------------------------------------------------------------

export interface LichessPlayer {
  id: string;
  name: string;
  rating?: number;
  title?: string;
}

/** Sent as the first event on the game stream, containing full game info. */
export interface LichessGameFull {
  type: 'gameFull';
  id: string;
  speed: string;
  rated: boolean;
  white: LichessPlayer;
  black: LichessPlayer;
  clock?: { initial: number; increment: number };
  /** The current game state (same shape as gameState events). */
  state: LichessGameStateEvent;
}

/** Sent after every move and on game end. */
export interface LichessGameStateEvent {
  type: 'gameState';
  /** Space-separated UCI moves from the start of the game, or empty string. */
  moves: string;
  wc: number;  // white clock ms remaining
  bc: number;  // black clock ms remaining
  /** 'started' | 'mate' | 'resign' | 'draw' | 'stalemate' | 'outoftime' | 'timeout' | 'aborted' | 'noStart' */
  status: string;
  winner?: 'white' | 'black';
  wdraw?: boolean;
  bdraw?: boolean;
}

type LichessGameEvent = LichessGameFull | LichessGameStateEvent | { type: string };

/** Event stream event for a newly started game (from seek match). */
interface LichessEventGameStart {
  type: 'gameStart';
  game: {
    gameId: string;
    fullId: string;
    color: 'white' | 'black';
    fen: string;
    hasMoved: boolean;
    isMyTurn: boolean;
    opponent: { id: string; username: string; rating?: number };
    speed: string;
  };
}

type LichessStreamEvent = LichessEventGameStart | { type: string };

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isGameFull(e: LichessGameEvent): e is LichessGameFull {
  return e.type === 'gameFull';
}

export function isGameState(e: LichessGameEvent): e is LichessGameStateEvent {
  return e.type === 'gameState';
}

function isGameStart(e: LichessStreamEvent): e is LichessEventGameStart {
  return e.type === 'gameStart';
}

/** Terminal statuses — game is over. */
export function isTerminalStatus(status: string): boolean {
  return status !== 'started' && status !== 'created' && status !== 'started';
}

// ---------------------------------------------------------------------------
// UCI helpers
// ---------------------------------------------------------------------------

/** Parse a UCI move string (e.g. "e2e4" or "e7e8q") into { from, to, promotion? }. */
export function parseUci(uci: string): { from: string; to: string; promotion?: string } {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    ...(uci.length === 5 ? { promotion: uci[4] } : {}),
  };
}

/** Convert from/to/promotion from a chess.js move into a UCI string for lichess. */
export function toUci(from: string, to: string, promotion?: string): string {
  return from + to + (promotion ?? '');
}

// ---------------------------------------------------------------------------
// Active game persistence
// ---------------------------------------------------------------------------

export interface LichessActive {
  gameId: string;
  accountId: string;
  color: 'white' | 'black';
}

export function persistActiveGame(active: LichessActive): void {
  localStorage.setItem(LS_LICHESS_ACTIVE, JSON.stringify(active));
}

export function getActiveGame(): LichessActive | null {
  const raw = localStorage.getItem(LS_LICHESS_ACTIVE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LichessActive;
  } catch {
    return null;
  }
}

export function clearActiveGame(): void {
  localStorage.removeItem(LS_LICHESS_ACTIVE);
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Send a move in UCI notation to lichess. */
export async function makeMove(
  client: LichessClient,
  gameId: string,
  uci: string
): Promise<void> {
  await client.post(`/api/board/game/${gameId}/move/${uci}`);
  logger.debug('lichess move sent', uci);
}

/** Resign the game. */
export async function resign(client: LichessClient, gameId: string): Promise<void> {
  await client.post(`/api/board/game/${gameId}/resign`);
  logger.debug('lichess resign', gameId);
}

/** Abort the game (only valid before both sides have moved). */
export async function abort(client: LichessClient, gameId: string): Promise<void> {
  await client.post(`/api/board/game/${gameId}/abort`);
  logger.debug('lichess abort', gameId);
}

// ---------------------------------------------------------------------------
// Game stream
// ---------------------------------------------------------------------------

/**
 * Open the live game stream for a given game.
 * Reconnects automatically with exponential backoff.
 * Returns a cancel function — call it on component destroy.
 */
export function streamGame(
  client: LichessClient,
  gameId: string,
  onEvent: (e: LichessGameFull | LichessGameStateEvent) => void,
  onError?: (err: unknown) => void
): () => void {
  return reconnectingStream<LichessGameEvent>(
    `https://lichess.org/api/board/game/stream/${gameId}`,
    client.token,
    (e) => {
      if (isGameFull(e) || isGameState(e)) onEvent(e);
    },
    onError
  );
}

// ---------------------------------------------------------------------------
// Seek
// ---------------------------------------------------------------------------

/**
 * Post a seek for a random opponent and wait for a game to start.
 * Resolves with the game ID and our color when matched.
 * Rejects if the signal is aborted or a network error occurs.
 */
export async function seekAndWait(
  client: LichessClient,
  tc: TimeControl,
  signal: AbortSignal
): Promise<{ gameId: string; color: 'white' | 'black' }> {
  return new Promise<{ gameId: string; color: 'white' | 'black' }>((resolve, reject) => {
    let done = false;
    const seekController = new AbortController();
    const eventController = new AbortController();

    function cleanup() {
      seekController.abort();
      eventController.abort();
    }

    signal.addEventListener('abort', () => {
      cleanup();
      if (!done) {
        done = true;
        reject(new DOMException('Seek cancelled', 'AbortError'));
      }
    });

    // Event stream — listen for gameStart notification
    streamNdjson<LichessStreamEvent>(
      'https://lichess.org/api/stream/event',
      client.token,
      (e) => {
        if (done) return;
        if (isGameStart(e)) {
          done = true;
          cleanup();
          resolve({ gameId: e.game.gameId, color: e.game.color });
        }
      },
      eventController.signal
    ).catch((err: unknown) => {
      if (!done) {
        done = true;
        cleanup();
        reject(err);
      }
    });

    // Seek POST — keeps connection open while lichess looks for an opponent.
    // The connection stays alive until seekController is aborted (on game start or cancel).
    const seekBody = new URLSearchParams({
      rated: 'false',
      time: String(Math.max(1, Math.round(tc.initialSec / 60))),
      increment: String(tc.incrementSec),
      color: 'random',
      variant: 'standard',
    });
    client
      .post('/api/board/seek', seekBody, seekController.signal)
      .catch((err: unknown) => {
        // AbortError is expected when the game starts — ignore it
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!done) {
          done = true;
          cleanup();
          reject(err);
        }
      });
  });
}
