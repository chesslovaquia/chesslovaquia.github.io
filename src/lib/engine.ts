// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';
import type { Move } from 'chess.js';

export type { Move };

export type GameStatus =
  | 'in_progress'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resigned'
  | 'aborted';

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*';

/**
 * Thin wrapper around chess.js. All chess logic goes through this;
 * nothing else imports chess.js directly.
 */
export class Engine {
  private _chess: Chess;
  private _status: GameStatus = 'in_progress';

  constructor() {
    this._chess = new Chess();
  }

  /** Apply a move by SAN or {from, to, promotion} object. Throws on illegal move. */
  move(san: string | { from: string; to: string; promotion?: string }): Move {
    return this._chess.move(san);
  }

  /**
   * Legal SAN moves for the current position.
   * When `square` is provided, restricted to moves from that square.
   */
  moves(square?: string): string[] {
    if (square) {
      // chess.js Square type is a union of all 64 square strings
      return this._chess.moves({ square: square as 'a1' });
    }
    return this._chess.moves();
  }

  /**
   * Legal move destinations for chessground: map from origin square to
   * array of destination squares.
   */
  legalMoves(): Map<string, string[]> {
    const dests = new Map<string, string[]>();
    const moves = this._chess.moves({ verbose: true });
    for (const m of moves) {
      const existing = dests.get(m.from);
      if (existing) {
        existing.push(m.to);
      } else {
        dests.set(m.from, [m.to]);
      }
    }
    return dests;
  }

  /** Current board FEN. */
  fen(): string {
    return this._chess.fen();
  }

  /** Full PGN string. */
  pgn(): string {
    return this._chess.pgn();
  }

  /** Whose turn: 'w' or 'b'. */
  turn(): 'w' | 'b' {
    return this._chess.turn();
  }

  /** Computed status from chess.js state (does not include resigned/aborted). */
  chessStatus(): GameStatus {
    if (this._chess.isCheckmate()) return 'checkmate';
    if (this._chess.isStalemate()) return 'stalemate';
    if (this._chess.isDraw()) return 'draw';
    return 'in_progress';
  }

  /** Effective game status, including resign/abort set externally. */
  status(): GameStatus {
    if (this._status !== 'in_progress') return this._status;
    return this.chessStatus();
  }

  private _resignedSide: 'white' | 'black' | null = null;

  /** Mark game as resigned by `side`. */
  resign(side: 'white' | 'black'): void {
    this._status = 'resigned';
    this._resignedSide = side;
  }

  /** Mark game as aborted (before move 2). */
  abort(): void {
    this._status = 'aborted';
  }

  /** Mark agreed draw. */
  agreeDraw(): void {
    this._status = 'draw';
  }

  /** Game result string. */
  result(): GameResult {
    const s = this.status();
    if (s === 'in_progress') return '*';
    if (s === 'checkmate') {
      // the side that just moved delivered checkmate — turn() is the loser
      return this._chess.turn() === 'w' ? '0-1' : '1-0';
    }
    if (s === 'resigned') {
      return this._resignedSide === 'white' ? '0-1' : '1-0';
    }
    if (s === 'aborted') return '*';
    return '1/2-1/2';
  }

  /** Load position from FEN. */
  load(fen: string): void {
    this._chess.load(fen);
    this._status = 'in_progress';
    this._resignedSide = null;
  }

  /** Load game from PGN. */
  loadPgn(pgn: string): void {
    this._chess.loadPgn(pgn);
    this._status = 'in_progress';
    this._resignedSide = null;
  }

  /** Reset to starting position. */
  reset(): void {
    this._chess.reset();
    this._status = 'in_progress';
    this._resignedSide = null;
  }

  /** Number of half-moves played. */
  moveCount(): number {
    return this._chess.history().length;
  }

  /** SAN history. */
  history(): string[] {
    return this._chess.history();
  }

  /** Whether the position has the king in check. */
  isCheck(): boolean {
    return this._chess.isCheck();
  }
}
