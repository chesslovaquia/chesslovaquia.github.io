// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, beforeEach, afterEach, describe } from 'vitest';

import { HistoryManager } from '../../clvq/HistoryManager';
import { GameHistory } from '../../game/GameHistory';
import { LichessHistory } from '../../lichess/LichessHistory';
import { LichessAuth } from '../../lichess/LichessAuth';
import type { HistoryRecord } from '../../game/GameHistory';

function makeRecord(overrides: Partial<HistoryRecord> = {}): HistoryRecord {
	return {
		id:          'rec-1',
		date:        '2026-01-15T10:00:00Z',
		white:       'Alice',
		black:       'Bob',
		result:      '1-0',
		timeControl: '10+0',
		pgn:         '[Event "?"]\n1. e4 e5 *',
		source:      'local',
		...overrides,
	};
}

function mockAuth(): LichessAuth {
	return {
		isLoggedIn: vi.fn(() => true),
		getUser:    vi.fn(() => null),
	} as unknown as LichessAuth;
}

function setupDOM(): void {
	document.body.innerHTML = `
		<div id="gameHistoryModal" style="display:none"></div>
		<div id="gameHistoryList"></div>
	`;
}

beforeEach(() => {
	setupDOM();
	localStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
	localStorage.clear();
});

// --- load ---

describe('HistoryManager.load', () => {
	test('renders records and shows modal', async () => {
		const records = [makeRecord()];
		vi.spyOn(GameHistory.prototype, 'list').mockResolvedValue(records);

		const mgr = new HistoryManager();
		mgr.load();

		await vi.waitFor(() => {
			const list = document.getElementById('gameHistoryList')!;
			expect(list.innerHTML).toContain('Alice vs Bob');
		});
	});

	test('renders empty state message when no records', async () => {
		vi.spyOn(GameHistory.prototype, 'list').mockResolvedValue([]);

		const mgr = new HistoryManager();
		mgr.load();

		await vi.waitFor(() => {
			const list = document.getElementById('gameHistoryList')!;
			expect(list.innerHTML).toContain('No games yet.');
		});
	});

	test('renders result and time control', async () => {
		const records = [makeRecord({ result: '0-1', timeControl: '5+3' })];
		vi.spyOn(GameHistory.prototype, 'list').mockResolvedValue(records);

		const mgr = new HistoryManager();
		mgr.load();

		await vi.waitFor(() => {
			const list = document.getElementById('gameHistoryList')!;
			expect(list.innerHTML).toContain('0-1');
			expect(list.innerHTML).toContain('5+3');
		});
	});

	test('renders date slice (first 10 chars)', async () => {
		const records = [makeRecord({ date: '2026-03-25T12:00:00Z' })];
		vi.spyOn(GameHistory.prototype, 'list').mockResolvedValue(records);

		const mgr = new HistoryManager();
		mgr.load();

		await vi.waitFor(() => {
			const list = document.getElementById('gameHistoryList')!;
			expect(list.innerHTML).toContain('2026-03-25');
		});
	});

	test('appends [lichess] tag for lichess source records', async () => {
		const records = [makeRecord({ source: 'lichess' })];
		vi.spyOn(GameHistory.prototype, 'list').mockResolvedValue(records);

		const mgr = new HistoryManager();
		mgr.load();

		await vi.waitFor(() => {
			const list = document.getElementById('gameHistoryList')!;
			expect(list.innerHTML).toContain('[lichess]');
		});
	});
});

// --- loadFromLichess ---

describe('HistoryManager.loadFromLichess', () => {
	test('fetches lichess games and re-renders full list', async () => {
		const lichessRecord = makeRecord({ id: 'lich-1', source: 'lichess', white: 'Magnus' });
		const allRecords    = [lichessRecord, makeRecord({ id: 'local-1' })];

		vi.spyOn(LichessHistory.prototype, 'fetchGames').mockResolvedValue([lichessRecord]);
		vi.spyOn(GameHistory.prototype,    'list').mockResolvedValue(allRecords);

		const mgr  = new HistoryManager();
		const auth = mockAuth();
		mgr.loadFromLichess(auth);

		await vi.waitFor(() => {
			const list = document.getElementById('gameHistoryList')!;
			expect(list.innerHTML).toContain('Magnus');
		});
	});
});

// --- exportPgn ---

describe('HistoryManager.exportPgn', () => {
	test('does nothing when index out of bounds', async () => {
		vi.spyOn(GameHistory.prototype, 'list').mockResolvedValue([]);
		const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');

		const mgr = new HistoryManager();
		mgr.load();
		await vi.waitFor(() => { /* wait for load */ });

		mgr.exportPgn(99);
		expect(createSpy).not.toHaveBeenCalled();
	});

	test('creates and revokes object URL for valid index', async () => {
		const records = [makeRecord({ pgn: '[Event "Test"]\n1. e4 *' })];
		vi.spyOn(GameHistory.prototype, 'list').mockResolvedValue(records);

		const createSpy  = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
		const revokeSpy  = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { /* noop */ });

		const mgr = new HistoryManager();
		mgr.load();

		await vi.waitFor(() => {
			const list = document.getElementById('gameHistoryList')!;
			expect(list.innerHTML).toContain('Alice');
		});

		mgr.exportPgn(0);
		expect(createSpy).toHaveBeenCalled();
		expect(revokeSpy).toHaveBeenCalledWith('blob:test');
	});
});
