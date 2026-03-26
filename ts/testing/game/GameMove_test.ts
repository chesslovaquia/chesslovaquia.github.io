// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, describe } from 'vitest';

import { GameMove } from '../../game/GameMove';

import type { GameEngine, EngineMove } from '../../engine/GameEngine';
import type { GameBoard } from '../../board/GameBoard';

function mockEngine(): GameEngine {
	return {
		turn:                  vi.fn(() => 'w'),
		fen:                   vi.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
		possibleDests:         vi.fn(() => new Map()),
		lastMove:              vi.fn(() => undefined),
		isPromotion:           vi.fn(() => false),
		move:                  vi.fn(() => undefined),
		undo:                  vi.fn(() => undefined),
		isGameOver:            vi.fn(() => false),
		isCheckmate:           vi.fn(() => false),
		isDraw:                vi.fn(() => false),
		isStalemate:           vi.fn(() => false),
		isThreefoldRepetition: vi.fn(() => false),
		isInsufficientMaterial: vi.fn(() => false),
		getState:              vi.fn(() => []),
		setState:              vi.fn(),
		capturedPiece:         vi.fn(() => undefined),
		pgn:                   vi.fn(() => ''),
	} as unknown as GameEngine;
}

function mockBoard(): GameBoard {
	return {
		init:        vi.fn(),
		reset:       vi.fn(),
		update:      vi.fn(),
		enable:      vi.fn(),
		disable:     vi.fn(),
		getFen:      vi.fn(() => ''),
		flip:        vi.fn(),
		setPosition: vi.fn(),
	} as unknown as GameBoard;
}

// --- exec ---

describe('GameMove.exec', () => {
	test('valid move: calls board.update()', () => {
		const engine = mockEngine();
		const board = mockBoard();
		const gameMove = new GameMove(engine, board);
		(engine.move as ReturnType<typeof vi.fn>).mockReturnValue({ from: 'e2', to: 'e4' });

		gameMove.exec('e2', 'e4', 'q');

		expect(engine.move).toHaveBeenCalledWith({ from: 'e2', to: 'e4', promotion: 'q' });
		expect(board.update).toHaveBeenCalled();
		expect(board.reset).not.toHaveBeenCalled();
	});

	test('engine returns null (invalid move): calls board.reset()', () => {
		const engine = mockEngine();
		const board = mockBoard();
		const gameMove = new GameMove(engine, board);
		(engine.move as ReturnType<typeof vi.fn>).mockReturnValue(null);

		gameMove.exec('e2', 'e5', 'q');

		expect(board.reset).toHaveBeenCalled();
		expect(board.update).not.toHaveBeenCalled();
	});

	test('engine throws (invalid move): calls board.reset()', () => {
		const engine = mockEngine();
		const board = mockBoard();
		const gameMove = new GameMove(engine, board);
		(engine.move as ReturnType<typeof vi.fn>).mockImplementation(() => { throw new Error('illegal move'); });

		gameMove.exec('e2', 'e5', 'q');

		expect(board.reset).toHaveBeenCalled();
		expect(board.update).not.toHaveBeenCalled();
	});
});

// --- undo ---

describe('GameMove.undo', () => {
	test('returns true and calls board.update() when a move is undone', () => {
		const engine = mockEngine();
		const board = mockBoard();
		const gameMove = new GameMove(engine, board);
		const move = { from: 'e2', to: 'e4' };
		(engine.undo as ReturnType<typeof vi.fn>).mockReturnValue(move);

		const result = gameMove.undo();

		expect(result).toBe(true);
		expect(board.update).toHaveBeenCalled();
	});

	test('returns false and does not call board.update() when nothing to undo', () => {
		const engine = mockEngine();
		const board = mockBoard();
		const gameMove = new GameMove(engine, board);
		(engine.undo as ReturnType<typeof vi.fn>).mockReturnValue(null);

		const result = gameMove.undo();

		expect(result).toBe(false);
		expect(board.update).not.toHaveBeenCalled();
	});
});

// --- turnColor ---

describe('GameMove.turnColor', () => {
	test("returns 'white' when engine turn is 'w'", () => {
		const engine = mockEngine();
		const board = mockBoard();
		const gameMove = new GameMove(engine, board);
		(engine.turn as ReturnType<typeof vi.fn>).mockReturnValue('w');

		expect(gameMove.turnColor()).toBe('white');
	});

	test("returns 'black' when engine turn is 'b'", () => {
		const engine = mockEngine();
		const board = mockBoard();
		const gameMove = new GameMove(engine, board);
		(engine.turn as ReturnType<typeof vi.fn>).mockReturnValue('b');

		expect(gameMove.turnColor()).toBe('black');
	});
});
