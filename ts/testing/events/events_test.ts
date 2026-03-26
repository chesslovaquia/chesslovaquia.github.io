// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, describe } from 'vitest';

import { EventBoardMove    } from '../../events/EventBoardMove';
import { EventClockTimeout } from '../../events/EventClockTimeout';
import { EventOpponentMove } from '../../events/EventOpponentMove';
import { EventGameOver     } from '../../events/EventGameOver';

// --- EventBoardMove ---

describe('EventBoardMove', () => {
	test('Name is clvqBoardMove', () => {
		expect(EventBoardMove.Name).toBe('clvqBoardMove');
	});

	test('Target is document', () => {
		expect(EventBoardMove.Target).toBe(document);
	});

	test('detail contains the move data', () => {
		const move = { from: 'e2' as const, to: 'e4' as const, promotion: 'q' as const };
		const ev = new EventBoardMove(move);
		expect(ev.detail).toEqual(move);
	});

	test('dispatches on document', () => {
		const move = { from: 'd7' as const, to: 'd5' as const, promotion: 'q' as const };
		const ev = new EventBoardMove(move);
		let received = false;
		document.addEventListener(EventBoardMove.Name, () => { received = true; }, { once: true });
		document.dispatchEvent(ev);
		expect(received).toBe(true);
	});
});

// --- EventClockTimeout ---

describe('EventClockTimeout', () => {
	test('Name is clvqClockTimeout', () => {
		expect(EventClockTimeout.Name).toBe('clvqClockTimeout');
	});

	test('Target is document', () => {
		expect(EventClockTimeout.Target).toBe(document);
	});

	test('detail contains the color', () => {
		const ev = new EventClockTimeout('w');
		expect(ev.detail).toEqual({ color: 'w' });
	});

	test('dispatches on document', () => {
		const ev = new EventClockTimeout('b');
		let received = false;
		document.addEventListener(EventClockTimeout.Name, () => { received = true; }, { once: true });
		document.dispatchEvent(ev);
		expect(received).toBe(true);
	});
});

// --- EventOpponentMove ---

describe('EventOpponentMove', () => {
	test('Name is clvqOpponentMove', () => {
		expect(EventOpponentMove.Name).toBe('clvqOpponentMove');
	});

	test('Target is document', () => {
		expect(EventOpponentMove.Target).toBe(document);
	});

	test('detail contains the move data', () => {
		const move = { from: 'g8' as const, to: 'f6' as const, promotion: 'q' as const };
		const ev = new EventOpponentMove(move);
		expect(ev.detail).toEqual(move);
	});

	test('dispatches on document', () => {
		const ev = new EventOpponentMove({ from: 'c7' as const, to: 'c5' as const, promotion: 'q' as const });
		let received = false;
		document.addEventListener(EventOpponentMove.Name, () => { received = true; }, { once: true });
		document.dispatchEvent(ev);
		expect(received).toBe(true);
	});
});

// --- EventGameOver ---

describe('EventGameOver', () => {
	test('Name is clvqGameOver', () => {
		expect(EventGameOver.Name).toBe('clvqGameOver');
	});

	test('Target is document', () => {
		expect(EventGameOver.Target).toBe(document);
	});

	test('detail contains reason and winner', () => {
		const ev = new EventGameOver({ reason: 'resign', winner: 'white' });
		expect(ev.detail).toEqual({ reason: 'resign', winner: 'white' });
	});

	test('detail without winner (draw)', () => {
		const ev = new EventGameOver({ reason: 'draw' });
		expect(ev.detail.reason).toBe('draw');
		expect(ev.detail.winner).toBeUndefined();
	});

	test('dispatches on document', () => {
		const ev = new EventGameOver({ reason: 'checkmate', winner: 'black' });
		let received = false;
		document.addEventListener(EventGameOver.Name, () => { received = true; }, { once: true });
		document.dispatchEvent(ev);
		expect(received).toBe(true);
	});
});
