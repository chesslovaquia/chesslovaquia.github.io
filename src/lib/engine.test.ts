// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from './engine';

describe('Engine', () => {
  let engine: Engine;

  beforeEach(() => {
    engine = new Engine();
  });

  it('starts at the initial position', () => {
    expect(engine.fen()).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq');
  });

  it('returns legal moves from the start', () => {
    const moves = engine.moves();
    expect(moves.length).toBe(20);
  });

  it('applies a legal move', () => {
    engine.move('e4');
    // Pawn is now on e4
    expect(engine.fen()).toContain('4P3');
  });

  it('tracks turn', () => {
    expect(engine.turn()).toBe('w');
    engine.move('e4');
    expect(engine.turn()).toBe('b');
  });

  it('reports in_progress status', () => {
    expect(engine.status()).toBe('in_progress');
  });

  it('reports result * while in progress', () => {
    expect(engine.result()).toBe('*');
  });

  it('detects checkmate (fool\'s mate)', () => {
    engine.move('f3');
    engine.move('e5');
    engine.move('g4');
    engine.move('Qh4');
    expect(engine.status()).toBe('checkmate');
    expect(engine.result()).toBe('0-1');
  });

  it('detects stalemate', () => {
    // Load a known stalemate position
    engine.load('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(engine.status()).toBe('stalemate');
    expect(engine.result()).toBe('1/2-1/2');
  });

  it('builds legalMoves map', () => {
    const dests = engine.legalMoves();
    expect(dests.size).toBe(10); // 10 pawns + 2 knights = 20 moves from 10 squares
    expect(dests.has('e2')).toBe(true);
  });

  it('resign sets result to 0-1 when white resigns', () => {
    engine.resign('white');
    expect(engine.status()).toBe('resigned');
    expect(engine.result()).toBe('0-1');
  });

  it('resign sets result to 1-0 when black resigns', () => {
    engine.resign('black');
    expect(engine.result()).toBe('1-0');
  });

  it('abort sets status to aborted and result to *', () => {
    engine.abort();
    expect(engine.status()).toBe('aborted');
    expect(engine.result()).toBe('*');
  });

  it('moveCount returns correct count', () => {
    expect(engine.moveCount()).toBe(0);
    engine.move('e4');
    expect(engine.moveCount()).toBe(1);
    engine.move('e5');
    expect(engine.moveCount()).toBe(2);
  });

  it('history returns SAN list', () => {
    engine.move('e4');
    engine.move('e5');
    expect(engine.history()).toEqual(['e4', 'e5']);
  });

  it('reset returns to initial position', () => {
    engine.move('e4');
    engine.reset();
    expect(engine.moveCount()).toBe(0);
    expect(engine.status()).toBe('in_progress');
  });

  it('pgn round-trips', () => {
    engine.move('e4');
    engine.move('e5');
    const pgn = engine.pgn();
    const engine2 = new Engine();
    engine2.loadPgn(pgn);
    expect(engine2.history()).toEqual(['e4', 'e5']);
  });

  describe('isCheck', () => {
    it('returns false at the starting position', () => {
      expect(engine.isCheck()).toBe(false);
    });

    it('returns false after normal opening moves', () => {
      engine.move('e4');
      engine.move('e5');
      engine.move('Nf3');
      engine.move('Nc6');
      expect(engine.isCheck()).toBe(false);
    });

    it('returns false for the side that just delivered check', () => {
      // After 1.e4 e5 2.Qh5 Nf6, white is to move — white is not in check
      engine.move('e4');
      engine.move('e5');
      engine.move('Qh5');
      engine.move('Nf6');
      expect(engine.isCheck()).toBe(false);
    });

    it('returns true when the king is in check', () => {
      // 1.e4 e5 2.Qh5 Nf6?? 3.Qxf7+ — black king on e8 is in check
      engine.move('e4');
      engine.move('e5');
      engine.move('Qh5');
      engine.move('Nf6');
      engine.move('Qxf7+');
      expect(engine.isCheck()).toBe(true);
    });

    it('returns true at a checkmate position (king is still in check)', () => {
      // Fool's mate
      engine.move('f3');
      engine.move('e5');
      engine.move('g4');
      engine.move('Qh4#');
      expect(engine.status()).toBe('checkmate');
      expect(engine.isCheck()).toBe(true);
    });

    it('returns true when loaded from a check FEN', () => {
      // Black king on e8, white queen on f7 — black to move, in check
      engine.load('r1bqkb1r/pppp1Qpp/5n2/4p3/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 0 3');
      expect(engine.isCheck()).toBe(true);
    });

    it('returns false when loaded from a non-check FEN', () => {
      // Standard position after 1.e4 e5
      engine.load('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');
      expect(engine.isCheck()).toBe(false);
    });
  });

  describe('checkHistory tracking (rebuildHistory pattern)', () => {
    it('records false for all positions in a game with no checks', () => {
      const tmp = new Engine();
      const sans = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'];
      const checkHistory: boolean[] = [false];
      for (const san of sans) {
        tmp.move(san);
        checkHistory.push(tmp.isCheck());
      }
      expect(checkHistory).toEqual([false, false, false, false, false, false]);
    });

    it('records true only at positions where the king is in check', () => {
      const tmp = new Engine();
      // 1.e4 e5 2.Qh5 Nf6?? 3.Qxf7+ — check appears only at the last position
      const sans = ['e4', 'e5', 'Qh5', 'Nf6', 'Qxf7+'];
      const checkHistory: boolean[] = [false];
      for (const san of sans) {
        tmp.move(san);
        checkHistory.push(tmp.isCheck());
      }
      expect(checkHistory).toHaveLength(6);
      expect(checkHistory[0]).toBe(false); // initial
      expect(checkHistory[1]).toBe(false); // after 1.e4
      expect(checkHistory[2]).toBe(false); // after 1...e5
      expect(checkHistory[3]).toBe(false); // after 2.Qh5
      expect(checkHistory[4]).toBe(false); // after 2...Nf6
      expect(checkHistory[5]).toBe(true);  // after 3.Qxf7+
    });

    it('records true at a checkmate position', () => {
      const tmp = new Engine();
      const sans = ['f3', 'e5', 'g4', 'Qh4#'];
      const checkHistory: boolean[] = [false];
      for (const san of sans) {
        tmp.move(san);
        checkHistory.push(tmp.isCheck());
      }
      // After Qh4# the white king is not in check — black delivered mate to white
      expect(checkHistory[4]).toBe(true);
    });

    it('records check at intermediate positions correctly', () => {
      const tmp = new Engine();
      // Rook-chase study: white rook chases black king down ranks
      // Start: white Ka1 + Rg1, black Kh5 (black to move, not in check)
      // 1...Kh4 2.Rg4+ (check via rank 4) Kh3 3.Rg3+ (check via rank 3)
      tmp.load('8/8/8/7k/8/8/8/K5R1 b - - 0 1');
      const checkHistory: boolean[] = [tmp.isCheck()];
      const sans = ['Kh4', 'Rg4+', 'Kh3', 'Rg3+'];
      for (const san of sans) {
        tmp.move(san);
        checkHistory.push(tmp.isCheck());
      }
      expect(checkHistory[0]).toBe(false); // initial: black to move, not in check
      expect(checkHistory[1]).toBe(false); // after 1...Ke3
      expect(checkHistory[2]).toBe(true);  // after 2.Rg3+ (rook checks via rank 3)
      expect(checkHistory[3]).toBe(false); // after 2...Ke4 (escapes)
      expect(checkHistory[4]).toBe(true);  // after 3.Rg4+ (rook checks via rank 4)
    });
  });
});
