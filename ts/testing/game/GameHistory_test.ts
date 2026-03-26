// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, describe, beforeEach } from 'vitest';

import { ClvqIndexedDB, Store } from '../../clvq/ClvqIndexedDB';
import { GameHistory  } from '../../game/GameHistory';
import type { HistoryRecord } from '../../game/GameHistory';

function makeRecord(id: string, date: string): HistoryRecord {
	return {
		id,
		date,
		white:       'White',
		black:       'Black',
		result:      '1-0',
		timeControl: '600+0',
		pgn:         `[White "White"]\n[Black "Black"]\n[Result "1-0"]\n\n1. e4 1-0`,
		source:      'local',
	};
}

describe('GameHistory', () => {
	let history: GameHistory;

	beforeEach(async () => {
		await new ClvqIndexedDB<HistoryRecord>(Store.history).clearAll();
		history = new GameHistory();
	});

	test('list returns empty array when no records', async () => {
		const records = await history.list();
		expect(records).toEqual([]);
	});

	test('save and retrieve a record', async () => {
		const r = makeRecord('test-1', '2026-03-25T10:00:00.000Z');
		await history.save(r);
		const records = await history.list();
		expect(records).toHaveLength(1);
		expect(records[0].id).toBe('test-1');
		expect(records[0].white).toBe('White');
		expect(records[0].result).toBe('1-0');
	});

	test('list sorts newest first', async () => {
		await history.save(makeRecord('old', '2026-01-01T00:00:00.000Z'));
		await history.save(makeRecord('new', '2026-03-25T00:00:00.000Z'));
		const records = await history.list();
		expect(records[0].id).toBe('new');
		expect(records[1].id).toBe('old');
	});

	test('delete removes a record', async () => {
		await history.save(makeRecord('del-me', '2026-03-25T00:00:00.000Z'));
		await history.delete('del-me');
		const records = await history.list();
		expect(records.find(r => r.id === 'del-me')).toBeUndefined();
	});

	test('save overwrites existing record with same id', async () => {
		await history.save(makeRecord('dup', '2026-03-25T00:00:00.000Z'));
		const updated = { ...makeRecord('dup', '2026-03-25T00:00:00.000Z'), result: '0-1' };
		await history.save(updated);
		const records = await history.list();
		const found = records.find(r => r.id === 'dup');
		expect(found?.result).toBe('0-1');
	});

	test('save preserves lichess source and lichessId', async () => {
		const r: HistoryRecord = {
			...makeRecord('lich-1', '2026-03-25T00:00:00.000Z'),
			source:    'lichess',
			lichessId: 'abcde12345',
		};
		await history.save(r);
		const records = await history.list();
		expect(records[0].source).toBe('lichess');
		expect(records[0].lichessId).toBe('abcde12345');
	});
});
