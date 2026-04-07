// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, afterEach, describe } from 'vitest';

import { LichessClient  } from '../../lichess/LichessClient';
import { LichessError   } from '../../lichess/LichessError';
import { LichessStream  } from '../../lichess/LichessStream';
import { LichessGame    } from '../../lichess/LichessGame';
import type { StreamCallback } from '../../lichess/LichessStream';
import type { LichessChallenge, LichessGameFull, LichessGameState } from '../../lichess/LichessGame';

const encoder = new TextEncoder();

function seekStream(gameId: string): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(encoder.encode('\n'));
			controller.enqueue(encoder.encode(`{"id":"${gameId}"}\n`));
			controller.close();
		},
	});
}

type MockClientOpts = {
	postImpl?:       () => Promise<Response>;
	postStreamImpl?: () => Promise<ReadableStream<Uint8Array>>;
};

function mockClient(opts: MockClientOpts = {}): LichessClient {
	return {
		post:       vi.fn(opts.postImpl       ?? (() => Promise.resolve(new Response('', { status: 200 })))),
		postStream: vi.fn(opts.postStreamImpl ?? (() => Promise.resolve(seekStream('game123')))),
	} as unknown as LichessClient;
}

type MockStreamOpts = {
	openEventStream?: (cb: StreamCallback) => void;
	openGameStream?:  (gameId: string, cb: StreamCallback) => void;
};

function mockStream(opts: MockStreamOpts = {}): LichessStream {
	return {
		openEventStream:  vi.fn(opts.openEventStream ?? (() => {})),
		openGameStream:   vi.fn(opts.openGameStream  ?? (() => {})),
		closeEventStream: vi.fn(),
		closeGameStream:  vi.fn(),
		closeAll:         vi.fn(),
	} as unknown as LichessStream;
}

function newGame(client?: LichessClient, stream?: LichessStream): LichessGame {
	return new LichessGame(client ?? mockClient(), stream ?? mockStream());
}

afterEach(() => {
	vi.restoreAllMocks();
});

// --- seek ---

describe('LichessGame.seek', () => {
	test('calls postStream on /api/board/seek with correct params', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.seek({ time: 10, increment: 0 });
		expect(client.postStream).toHaveBeenCalledWith(
			'/api/board/seek',
			expect.any(URLSearchParams),
		);
		const body = (client.postStream as ReturnType<typeof vi.fn>).mock.calls[0][1] as URLSearchParams;
		expect(body.get('time')).toBe('10');
		expect(body.get('increment')).toBe('0');
		expect(body.get('color')).toBe('random');
		expect(body.get('variant')).toBe('standard');
	});

	test('returns the game ID from the stream', async () => {
		const client = mockClient();
		const game = newGame(client);
		const gameId = await game.seek({ time: 10, increment: 0 });
		expect(gameId).toBe('game123');
	});

	test('skips keepalive empty lines', async () => {
		const client = mockClient({
			postStreamImpl: () => {
				const stream = new ReadableStream<Uint8Array>({
					start(controller) {
						controller.enqueue(encoder.encode('\n\n\n'));
						controller.enqueue(encoder.encode('{"id":"afterKeepAlive"}\n'));
						controller.close();
					},
				});
				return Promise.resolve(stream);
			},
		});
		const game = newGame(client);
		const gameId = await game.seek({ time: 5, increment: 3 });
		expect(gameId).toBe('afterKeepAlive');
	});

	test('passes through custom color and variant', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.seek({ time: 15, increment: 10, color: 'white', variant: 'chess960' });
		const body = (client.postStream as ReturnType<typeof vi.fn>).mock.calls[0][1] as URLSearchParams;
		expect(body.get('color')).toBe('white');
		expect(body.get('variant')).toBe('chess960');
	});

	test('throws LichessError when stream closes without game ID', async () => {
		const client = mockClient({
			postStreamImpl: () => {
				const stream = new ReadableStream<Uint8Array>({
					start(controller) { controller.close(); },
				});
				return Promise.resolve(stream);
			},
		});
		const game = newGame(client);
		await expect(game.seek({ time: 10, increment: 0 })).rejects.toBeInstanceOf(LichessError);
	});

	test('propagates LichessError when postStream rejects', async () => {
		const client = mockClient({
			postStreamImpl: () => Promise.reject(new LichessError('rate limited')),
		});
		const game = newGame(client);
		await expect(game.seek({ time: 10, increment: 0 })).rejects.toBeInstanceOf(LichessError);
	});

	test('isSeeking is false after seek resolves', async () => {
		const game = newGame(mockClient());
		await game.seek({ time: 10, increment: 0 });
		expect(game.isSeeking).toBe(false);
	});

	test('isSeeking is false after seek rejects', async () => {
		const client = mockClient({
			postStreamImpl: () => Promise.reject(new LichessError('fail')),
		});
		const game = newGame(client);
		try { await game.seek({ time: 10, increment: 0 }); } catch { /* expected */ }
		expect(game.isSeeking).toBe(false);
	});
});

// --- cancelSeek ---

describe('LichessGame.cancelSeek', () => {
	test('does not throw when no seek is active', () => {
		const game = newGame();
		expect(() => game.cancelSeek()).not.toThrow();
	});

	test('isSeeking is false after cancel', () => {
		const game = newGame();
		game.cancelSeek();
		expect(game.isSeeking).toBe(false);
	});
});

// --- acceptChallenge ---

describe('LichessGame.acceptChallenge', () => {
	test('posts to correct path', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.acceptChallenge('abc123');
		expect(client.post).toHaveBeenCalledWith('/api/challenge/abc123/accept');
	});

	test('propagates LichessError on failure', async () => {
		const client = mockClient({ postImpl: () => Promise.reject(new LichessError('fail')) });
		const game = newGame(client);
		await expect(game.acceptChallenge('abc123')).rejects.toBeInstanceOf(LichessError);
	});
});

// --- declineChallenge ---

describe('LichessGame.declineChallenge', () => {
	test('posts to correct path', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.declineChallenge('abc123');
		expect(client.post).toHaveBeenCalledWith('/api/challenge/abc123/decline');
	});
});

// --- abort ---

describe('LichessGame.abort', () => {
	test('posts to correct path', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.abort('gid1');
		expect(client.post).toHaveBeenCalledWith('/api/board/game/gid1/abort');
	});
});

// --- resign ---

describe('LichessGame.resign', () => {
	test('posts to correct path', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.resign('gid1');
		expect(client.post).toHaveBeenCalledWith('/api/board/game/gid1/resign');
	});
});

// --- draw ---

describe('LichessGame.offerOrAcceptDraw', () => {
	test('posts draw/yes', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.offerOrAcceptDraw('gid1');
		expect(client.post).toHaveBeenCalledWith('/api/board/game/gid1/draw/yes');
	});
});

describe('LichessGame.declineDraw', () => {
	test('posts draw/no', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.declineDraw('gid1');
		expect(client.post).toHaveBeenCalledWith('/api/board/game/gid1/draw/no');
	});
});

// --- takeback ---

describe('LichessGame.offerOrAcceptTakeback', () => {
	test('posts takeback/yes', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.offerOrAcceptTakeback('gid1');
		expect(client.post).toHaveBeenCalledWith('/api/board/game/gid1/takeback/yes');
	});
});

describe('LichessGame.declineTakeback', () => {
	test('posts takeback/no', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.declineTakeback('gid1');
		expect(client.post).toHaveBeenCalledWith('/api/board/game/gid1/takeback/no');
	});
});

// --- makeMove ---

describe('LichessGame.makeMove', () => {
	test('posts to correct path', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.makeMove('gid1', 'e2e4');
		expect(client.post).toHaveBeenCalledWith('/api/board/game/gid1/move/e2e4');
	});

	test('posts promotion move', async () => {
		const client = mockClient();
		const game = newGame(client);
		await game.makeMove('gid2', 'e7e8q');
		expect(client.post).toHaveBeenCalledWith('/api/board/game/gid2/move/e7e8q');
	});
});

// --- stream lifecycle ---

describe('LichessGame.startEventStream', () => {
	test('calls stream.openEventStream with a function', () => {
		const stream = mockStream();
		const game = newGame(undefined, stream);
		game.startEventStream();
		expect(stream.openEventStream).toHaveBeenCalledWith(expect.any(Function));
	});
});

describe('LichessGame.stopEventStream', () => {
	test('calls stream.closeEventStream', () => {
		const stream = mockStream();
		const game = newGame(undefined, stream);
		game.stopEventStream();
		expect(stream.closeEventStream).toHaveBeenCalled();
	});
});

describe('LichessGame.startGameStream', () => {
	test('calls stream.openGameStream with correct gameId', () => {
		const stream = mockStream();
		const game = newGame(undefined, stream);
		game.startGameStream('xyz99');
		expect(stream.openGameStream).toHaveBeenCalledWith('xyz99', expect.any(Function));
	});
});

describe('LichessGame.stopGameStream', () => {
	test('calls stream.closeGameStream', () => {
		const stream = mockStream();
		const game = newGame(undefined, stream);
		game.stopGameStream();
		expect(stream.closeGameStream).toHaveBeenCalled();
	});

	test('resets offer-tracking state so callbacks fire again on next game', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({
			openGameStream: (_id, cb) => { capturedCb = cb; },
		});
		const game = newGame(undefined, stream);
		game.startGameStream('g1');

		const drawOffers: string[] = [];
		game.onDrawOffer(color => drawOffers.push(color));

		const state: LichessGameState = {
			moves: '', wtime: 0, btime: 0, winc: 0, binc: 0, status: 'started', wdraw: true,
		};
		capturedCb({ type: 'gameState', ...state });
		expect(drawOffers).toHaveLength(1);

		// Close resets tracking; re-open and fire same event — should fire again
		game.stopGameStream();

		let capturedCb2!: StreamCallback;
		(stream.openGameStream as ReturnType<typeof vi.fn>).mockImplementationOnce(
			(_id: string, cb: StreamCallback) => { capturedCb2 = cb; },
		);
		game.startGameStream('g2');
		capturedCb2({ type: 'gameState', ...state });
		expect(drawOffers).toHaveLength(2);
	});
});

describe('LichessGame.stopAll', () => {
	test('calls stream.closeAll', () => {
		const stream = mockStream();
		const game = newGame(undefined, stream);
		game.stopAll();
		expect(stream.closeAll).toHaveBeenCalled();
	});

	test('cancels active seek', () => {
		const stream = mockStream();
		const game = newGame(undefined, stream);
		// Start a seek that hangs (never closes)
		const client = mockClient({
			postStreamImpl: () => Promise.resolve(new ReadableStream<Uint8Array>({ start() {} })),
		});
		const gameWithSeek = newGame(client, stream);
		void gameWithSeek.seek({ time: 10, increment: 0 });
		expect(gameWithSeek.isSeeking).toBe(true);
		gameWithSeek.stopAll();
		expect(gameWithSeek.isSeeking).toBe(false);
		expect(stream.closeAll).toHaveBeenCalled();
	});
});

// --- event stream routing ---

describe('LichessGame event routing — challenge', () => {
	test('fires onChallenge callback with payload', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openEventStream: cb => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startEventStream();

		const received: LichessChallenge[] = [];
		game.onChallenge(c => received.push(c));

		const challenge: LichessChallenge = {
			id: 'c1',
			challenger:  { id: 'u1', username: 'Alice' },
			destUser:    null,
			timeControl: { type: 'clock', limit: 600, increment: 0 },
			color:       'random',
			variant:     { key: 'standard' },
		};
		capturedCb({ type: 'challenge', challenge });

		expect(received).toHaveLength(1);
		expect(received[0].id).toBe('c1');
	});

	test('does not throw when no onChallenge callback is registered', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openEventStream: cb => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startEventStream();
		expect(() => capturedCb({ type: 'challenge', challenge: { id: 'x' } })).not.toThrow();
	});
});

describe('LichessGame event routing — gameStart', () => {
	test('fires onGameStart callback with gameId', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openEventStream: cb => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startEventStream();

		const ids: string[] = [];
		game.onGameStart(id => ids.push(id));

		capturedCb({ type: 'gameStart', game: { gameId: 'g42' } });

		expect(ids).toEqual(['g42']);
	});

	test('does not throw when no onGameStart callback is registered', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openEventStream: cb => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startEventStream();
		expect(() => capturedCb({ type: 'gameStart', game: { gameId: 'g1' } })).not.toThrow();
	});
});

describe('LichessGame event routing — gameFinish', () => {
	test('fires onGameFinish callback with gameId', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openEventStream: cb => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startEventStream();

		const ids: string[] = [];
		game.onGameFinish(id => ids.push(id));

		capturedCb({ type: 'gameFinish', game: { gameId: 'g42' } });

		expect(ids).toEqual(['g42']);
	});
});

describe('LichessGame event routing — unknown type', () => {
	test('ignores unknown event type without throwing', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openEventStream: cb => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startEventStream();
		expect(() => capturedCb({ type: 'someFutureType' })).not.toThrow();
	});
});

// --- game stream routing ---

describe('LichessGame game stream — gameFull', () => {
	test('fires onGameFull callback', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openGameStream: (_id, cb) => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startGameStream('g1');

		const received: LichessGameFull[] = [];
		game.onGameFull(e => received.push(e));

		const full: LichessGameFull = {
			id:      'g1',
			white:   { id: 'u1', username: 'Alice' },
			black:   { id: 'u2', username: 'Bob' },
			state:   { moves: '', wtime: 600000, btime: 600000, winc: 0, binc: 0, status: 'started' },
			variant: { key: 'standard' },
		};
		capturedCb({ type: 'gameFull', ...full });

		expect(received).toHaveLength(1);
		expect(received[0].id).toBe('g1');
	});

	test('does not throw when no onGameFull callback registered', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openGameStream: (_id, cb) => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startGameStream('g1');
		expect(() => capturedCb({ type: 'gameFull', id: 'g1' })).not.toThrow();
	});
});

describe('LichessGame game stream — gameState', () => {
	function setupGameStream(): { game: LichessGame; fire: StreamCallback } {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openGameStream: (_id, cb) => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startGameStream('g1');
		return { game, fire: capturedCb };
	}

	const baseState: LichessGameState = {
		moves: 'e2e4', wtime: 600000, btime: 600000, winc: 0, binc: 0, status: 'started',
	};

	test('fires onGameState callback', () => {
		const { game, fire } = setupGameStream();
		const received: LichessGameState[] = [];
		game.onGameState(s => received.push(s));
		fire({ type: 'gameState', ...baseState });
		expect(received).toHaveLength(1);
		expect(received[0].moves).toBe('e2e4');
	});

	test('fires onDrawOffer with "white" when wdraw transitions to true', () => {
		const { game, fire } = setupGameStream();
		const offers: string[] = [];
		game.onDrawOffer(color => offers.push(color));
		fire({ type: 'gameState', ...baseState, wdraw: true });
		expect(offers).toEqual(['white']);
	});

	test('fires onDrawOffer with "black" when bdraw transitions to true', () => {
		const { game, fire } = setupGameStream();
		const offers: string[] = [];
		game.onDrawOffer(color => offers.push(color));
		fire({ type: 'gameState', ...baseState, bdraw: true });
		expect(offers).toEqual(['black']);
	});

	test('does NOT re-fire onDrawOffer when wdraw stays true across events', () => {
		const { game, fire } = setupGameStream();
		const offers: string[] = [];
		game.onDrawOffer(color => offers.push(color));
		fire({ type: 'gameState', ...baseState, wdraw: true });
		fire({ type: 'gameState', ...baseState, wdraw: true });
		expect(offers).toHaveLength(1);
	});

	test('fires onTakebackOffer with "white" when wtakeback transitions to true', () => {
		const { game, fire } = setupGameStream();
		const offers: string[] = [];
		game.onTakebackOffer(color => offers.push(color));
		fire({ type: 'gameState', ...baseState, wtakeback: true });
		expect(offers).toEqual(['white']);
	});

	test('fires onTakebackOffer with "black" when btakeback transitions to true', () => {
		const { game, fire } = setupGameStream();
		const offers: string[] = [];
		game.onTakebackOffer(color => offers.push(color));
		fire({ type: 'gameState', ...baseState, btakeback: true });
		expect(offers).toEqual(['black']);
	});

	test('does NOT re-fire onTakebackOffer when flag stays true', () => {
		const { game, fire } = setupGameStream();
		const offers: string[] = [];
		game.onTakebackOffer(color => offers.push(color));
		fire({ type: 'gameState', ...baseState, wtakeback: true });
		fire({ type: 'gameState', ...baseState, wtakeback: true });
		expect(offers).toHaveLength(1);
	});

	test('fires both onGameState and onDrawOffer on the same event', () => {
		const { game, fire } = setupGameStream();
		const stateEvents: LichessGameState[] = [];
		const drawOffers:  string[] = [];
		game.onGameState(s => stateEvents.push(s));
		game.onDrawOffer(c => drawOffers.push(c));
		fire({ type: 'gameState', ...baseState, wdraw: true });
		expect(stateEvents).toHaveLength(1);
		expect(drawOffers).toHaveLength(1);
	});

	test('does not throw when no callbacks are registered', () => {
		const { fire } = setupGameStream();
		expect(() => fire({ type: 'gameState', ...baseState, wdraw: true })).not.toThrow();
	});
});

describe('LichessGame game stream — chatLine', () => {
	test('ignores chatLine event without throwing', () => {
		let capturedCb!: StreamCallback;
		const stream = mockStream({ openGameStream: (_id, cb) => { capturedCb = cb; } });
		const game = newGame(undefined, stream);
		game.startGameStream('g1');
		expect(() => capturedCb({ type: 'chatLine', username: 'Bob', text: 'gg' })).not.toThrow();
	});
});
