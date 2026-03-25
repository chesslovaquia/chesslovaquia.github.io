// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, describe, afterEach, beforeEach } from 'vitest';

import { LichessAuth    } from '../../lichess/LichessAuth';
import { LichessClient  } from '../../lichess/LichessClient';
import { LichessHistory } from '../../lichess/LichessHistory';
import { GameHistory    } from '../../game/GameHistory';

function mockAuth(userId = 'testuser'): LichessAuth {
	return {
		getUser:   () => ({ id: userId, username: userId }),
		getToken:  () => 'test-token',
		isLoggedIn: () => true,
	} as unknown as LichessAuth;
}

function mockClient(lines: string[]): LichessClient {
	const encoder = new TextEncoder();
	const chunks  = lines.map(l => encoder.encode(l + '\n'));
	const stream  = new ReadableStream<Uint8Array>({
		start(ctrl) {
			chunks.forEach(c => ctrl.enqueue(c));
			ctrl.close();
		},
	});
	return {
		getStream: vi.fn(() => Promise.resolve(stream)),
	} as unknown as LichessClient;
}

function makeGameLine(overrides: Record<string, unknown> = {}): string {
	const game = {
		id:        'abc12345',
		createdAt: 1711360800000,
		status:    'mate',
		winner:    'white',
		players: {
			white: { user: { name: 'Kasparov', id: 'kasparov' }, rating: 2851 },
			black: { user: { name: 'Karpov',   id: 'karpov'   }, rating: 2780 },
		},
		clock: { initial: 600, increment: 0 },
		pgn:   '[White "Kasparov"]\n[Black "Karpov"]\n[Result "1-0"]\n\n1. e4 1-0',
		...overrides,
	};
	return JSON.stringify(game);
}

beforeEach(() => {
	// Prevent writes to the shared IndexedDB so test files don't interfere.
	vi.spyOn(GameHistory.prototype, 'save').mockResolvedValue();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('LichessHistory.fetchGames', () => {
	test('returns a HistoryRecord for each game line', async () => {
		const client  = mockClient([makeGameLine()]);
		const hist    = new LichessHistory(mockAuth(), client);
		const records = await hist.fetchGames();
		expect(records).toHaveLength(1);
		expect(records[0].white).toBe('Kasparov');
		expect(records[0].black).toBe('Karpov');
		expect(records[0].result).toBe('1-0');
		expect(records[0].source).toBe('lichess');
		expect(records[0].lichessId).toBe('abc12345');
	});

	test('sets timeControl from clock.initial and increment', async () => {
		const client  = mockClient([makeGameLine({ clock: { initial: 900, increment: 10 } })]);
		const hist    = new LichessHistory(mockAuth(), client);
		const records = await hist.fetchGames();
		expect(records[0].timeControl).toBe('900+10');
	});

	test('result is 0-1 when black wins', async () => {
		const client  = mockClient([makeGameLine({ winner: 'black' })]);
		const hist    = new LichessHistory(mockAuth(), client);
		const records = await hist.fetchGames();
		expect(records[0].result).toBe('0-1');
	});

	test('result is 1/2-1/2 for draw status', async () => {
		const client  = mockClient([makeGameLine({ status: 'draw', winner: undefined })]);
		const hist    = new LichessHistory(mockAuth(), client);
		const records = await hist.fetchGames();
		expect(records[0].result).toBe('1/2-1/2');
	});

	test('result is * for aborted game', async () => {
		const client  = mockClient([makeGameLine({ status: 'aborted', winner: undefined })]);
		const hist    = new LichessHistory(mockAuth(), client);
		const records = await hist.fetchGames();
		expect(records[0].result).toBe('*');
	});

	test('handles missing clock with dash time control', async () => {
		const line   = makeGameLine({ clock: undefined });
		const client = mockClient([line]);
		const hist   = new LichessHistory(mockAuth(), client);
		const records = await hist.fetchGames();
		expect(records[0].timeControl).toBe('-');
	});

	test('handles AI opponent name', async () => {
		const line = makeGameLine({
			players: {
				white: { aiLevel: 5 },
				black: { user: { name: 'Human', id: 'human' }, rating: 1500 },
			},
			winner: 'black',
		});
		const client  = mockClient([line]);
		const hist    = new LichessHistory(mockAuth(), client);
		const records = await hist.fetchGames();
		expect(records[0].white).toBe('Stockfish level 5');
	});

	test('saves records to GameHistory', async () => {
		const saveSpy = vi.mocked(GameHistory.prototype.save);
		const client  = mockClient([makeGameLine(), makeGameLine({ id: 'xyz99999' })]);
		const hist    = new LichessHistory(mockAuth(), client);
		await hist.fetchGames();
		expect(saveSpy).toHaveBeenCalledTimes(2);
	});

	test('calls getStream with Accept: application/x-ndjson header', async () => {
		const client  = mockClient([makeGameLine()]);
		const hist    = new LichessHistory(mockAuth(), client);
		await hist.fetchGames();
		expect(client.getStream).toHaveBeenCalledWith(
			expect.stringContaining('/api/games/user/testuser'),
			expect.objectContaining({ 'Accept': 'application/x-ndjson' }),
		);
	});

	test('skips invalid JSON lines without throwing', async () => {
		const client  = mockClient(['{invalid json}', makeGameLine()]);
		const hist    = new LichessHistory(mockAuth(), client);
		const records = await hist.fetchGames();
		expect(records).toHaveLength(1);
	});

	test('throws when not logged in', async () => {
		const auth   = { getUser: () => null } as unknown as LichessAuth;
		const client = mockClient([]);
		const hist   = new LichessHistory(auth, client);
		await expect(hist.fetchGames()).rejects.toThrow('Not logged in');
	});
});
