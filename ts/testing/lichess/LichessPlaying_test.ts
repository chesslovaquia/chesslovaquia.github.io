// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, afterEach, describe } from 'vitest';

import { LichessClient  } from '../../lichess/LichessClient';
import { LichessPlaying } from '../../lichess/LichessPlaying';
import type { NowPlayingGame } from '../../lichess/LichessPlaying';

function mockClient(games: NowPlayingGame[]): LichessClient {
	const body = JSON.stringify({ nowPlaying: games });
	return {
		get: vi.fn(() => Promise.resolve(new Response(body, { status: 200 }))),
	} as unknown as LichessClient;
}

afterEach(() => {
	vi.restoreAllMocks();
});

const sampleGame: NowPlayingGame = {
	gameId:      'abc123',
	fullId:      'abc123xyz',
	color:       'white',
	fen:         'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
	hasMoved:    true,
	isMyTurn:    false,
	lastMove:    'e2e4',
	opponent:    { id: 'bob', username: 'Bob', rating: 1500 },
	speed:       'rapid',
	secondsLeft: 450,
	variant:     { key: 'standard', name: 'Standard' },
};

describe('LichessPlaying.fetchNowPlaying', () => {
	test('calls GET /api/account/playing', async () => {
		const client = mockClient([]);
		const playing = new LichessPlaying(client);
		await playing.fetchNowPlaying();
		expect(client.get).toHaveBeenCalledWith('/api/account/playing');
	});

	test('returns nowPlaying array', async () => {
		const client = mockClient([sampleGame]);
		const playing = new LichessPlaying(client);
		const games = await playing.fetchNowPlaying();
		expect(games).toHaveLength(1);
		expect(games[0].gameId).toBe('abc123');
		expect(games[0].opponent.username).toBe('Bob');
	});

	test('returns empty array when nowPlaying is empty', async () => {
		const client = mockClient([]);
		const playing = new LichessPlaying(client);
		const games = await playing.fetchNowPlaying();
		expect(games).toHaveLength(0);
	});

	test('returns multiple games', async () => {
		const game2: NowPlayingGame = {
			...sampleGame,
			gameId:   'def456',
			fullId:   'def456uvw',
			color:    'black',
			isMyTurn: true,
			opponent: { id: 'alice', username: 'Alice', rating: 1700 },
			speed:    'blitz',
		};
		const client = mockClient([sampleGame, game2]);
		const playing = new LichessPlaying(client);
		const games = await playing.fetchNowPlaying();
		expect(games).toHaveLength(2);
		expect(games[1].gameId).toBe('def456');
	});
});
