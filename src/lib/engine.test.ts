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
});
