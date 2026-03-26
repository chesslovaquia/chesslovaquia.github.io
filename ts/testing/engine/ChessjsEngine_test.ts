// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, describe } from 'vitest';

import { ChessjsEngine } from '../../engine/ChessjsEngine';
import { EngineError    } from '../../engine/EngineError';

describe('ChessjsEngine.setState', () => {
	test('applies valid moves', () => {
		const engine = new ChessjsEngine();
		engine.setState(['e4', 'e5', 'Nf3']);
		expect(engine.getState()).toEqual(['e4', 'e5', 'Nf3']);
	});

	test('throws EngineError on invalid move', () => {
		const engine = new ChessjsEngine();
		expect(() => engine.setState(['e4', 'INVALID'])).toThrow(EngineError);
	});

	test('restores pre-call position on partial-replay failure', () => {
		const engine = new ChessjsEngine();
		engine.setState(['e4', 'e5']);
		const originalFen = engine.fen();
		expect(() => engine.setState(['e4', 'e5', 'INVALID'])).toThrow(EngineError);
		expect(engine.fen()).toBe(originalFen);
	});
});

describe('ChessjsEngine.pgn', () => {
	test('returns a non-empty string', () => {
		const engine = new ChessjsEngine();
		expect(engine.pgn({})).toBeTruthy();
	});

	test('includes Result header when provided', () => {
		const engine = new ChessjsEngine();
		const pgn = engine.pgn({ Result: '1-0', White: 'Alice', Black: 'Bob' });
		expect(pgn).toContain('[Result "1-0"]');
		expect(pgn).toContain('[White "Alice"]');
		expect(pgn).toContain('[Black "Bob"]');
	});

	test('includes moves in SAN notation', () => {
		const engine = new ChessjsEngine();
		engine.setState(['e4', 'e5', 'Nf3']);
		const pgn = engine.pgn({});
		expect(pgn).toContain('e4');
		expect(pgn).toContain('e5');
		expect(pgn).toContain('Nf3');
	});

	test('empty game has no move text', () => {
		const engine = new ChessjsEngine();
		const pgn = engine.pgn({});
		// Should not contain move numbers
		expect(pgn).not.toMatch(/1\.\s+\w/);
	});

	test('Date header appears in output', () => {
		const engine = new ChessjsEngine();
		const pgn = engine.pgn({ Date: '2026.03.25' });
		expect(pgn).toContain('[Date "2026.03.25"]');
	});
});
