// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, afterEach, describe } from 'vitest';

import { LichessClient } from '../../lichess/LichessClient';
import { LichessStream } from '../../lichess/LichessStream';
import type { StreamEvent } from '../../lichess/LichessStream';

function makeNdjsonStream(lines: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	return new ReadableStream<Uint8Array>({
		start(controller) {
			for (const line of lines) {
				controller.enqueue(encoder.encode(line + '\n'));
			}
			controller.close();
		},
	});
}

function makeHangingStream(): ReadableStream<Uint8Array> {
	return new ReadableStream<Uint8Array>({ start() { /* never closes */ } });
}

function mockClient(getStream: (path: string) => Promise<ReadableStream<Uint8Array>>): LichessClient {
	return { getStream } as unknown as LichessClient;
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('LichessStream NDJSON parsing', () => {
	test('parses JSON lines and calls onEvent', async () => {
		const events: StreamEvent[] = [];
		const stream = makeNdjsonStream([
			JSON.stringify({ type: 'gameStart', gameId: 'abc' }),
			JSON.stringify({ type: 'gameFinish' }),
		]);
		const client = mockClient(() => Promise.resolve(stream));
		const ls = new LichessStream(client);

		ls.openEventStream(e => events.push(e));
		// Drain microtasks until stream is fully consumed
		await new Promise<void>(resolve => setTimeout(resolve, 0));

		ls.closeAll();

		expect(events).toHaveLength(2);
		expect(events[0].type).toBe('gameStart');
		expect(events[1].type).toBe('gameFinish');
	});

	test('skips empty lines (keepalives)', async () => {
		const events: StreamEvent[] = [];
		const encoder = new TextEncoder();
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				// keepalive empty line between two real events
				controller.enqueue(encoder.encode(JSON.stringify({ type: 'ping' }) + '\n'));
				controller.enqueue(encoder.encode('\n'));
				controller.enqueue(encoder.encode(JSON.stringify({ type: 'pong' }) + '\n'));
				controller.close();
			},
		});
		const client = mockClient(() => Promise.resolve(stream));
		const ls = new LichessStream(client);

		ls.openEventStream(e => events.push(e));
		await new Promise<void>(resolve => setTimeout(resolve, 0));

		ls.closeAll();

		expect(events).toHaveLength(2);
		expect(events[0].type).toBe('ping');
		expect(events[1].type).toBe('pong');
	});
});

describe('LichessStream.closeEventStream', () => {
	test('stops reading from an active stream', async () => {
		const events: StreamEvent[] = [];
		const client = mockClient(() => Promise.resolve(makeHangingStream()));
		const ls = new LichessStream(client);

		ls.openEventStream(e => events.push(e));
		await new Promise<void>(resolve => setTimeout(resolve, 0));

		// Close immediately — no events should have been dispatched
		ls.closeEventStream();

		expect(events).toHaveLength(0);
	});
});

describe('LichessStream.closeGameStream', () => {
	test('stops reading from an active game stream', async () => {
		const events: StreamEvent[] = [];
		const client = mockClient(() => Promise.resolve(makeHangingStream()));
		const ls = new LichessStream(client);

		ls.openGameStream('game123', e => events.push(e));
		await new Promise<void>(resolve => setTimeout(resolve, 0));

		ls.closeGameStream();

		expect(events).toHaveLength(0);
	});

	test('uses correct game stream path', async () => {
		const paths: string[] = [];
		const client = mockClient((path) => {
			paths.push(path);
			return Promise.resolve(makeNdjsonStream([]));
		});
		const ls = new LichessStream(client);

		ls.openGameStream('xyz99', () => {});
		await new Promise<void>(resolve => setTimeout(resolve, 0));

		ls.closeAll();

		expect(paths[0]).toBe('/api/board/game/stream/xyz99');
	});
});

describe('LichessStream.closeAll', () => {
	test('stops both event and game streams', async () => {
		let calls = 0;
		const client = mockClient(() => {
			calls++;
			return Promise.resolve(makeHangingStream());
		});
		const ls = new LichessStream(client);

		ls.openEventStream(() => {});
		ls.openGameStream('g1', () => {});
		await new Promise<void>(resolve => setTimeout(resolve, 0));

		ls.closeAll();

		// Both slots should be stopped — no reconnect attempts
		expect(calls).toBe(2);
	});
});

describe('LichessStream reconnect', () => {
	test('reconnects after stream error with exponential backoff', async () => {
		vi.useFakeTimers();

		const events: StreamEvent[] = [];
		let call = 0;

		const client = mockClient(() => {
			call++;
			if (call === 1) return Promise.reject(new Error('network error'));
			return Promise.resolve(makeNdjsonStream([JSON.stringify({ type: 'reconnected' })]));
		});

		const ls = new LichessStream(client);
		ls.openEventStream(e => events.push(e));

		// Advance past the first backoff delay (2^0 * 1000 = 1000ms).
		// advanceTimersByTimeAsync fires the timer and flushes all pending
		// microtasks, so the second stream attempt runs to completion.
		await vi.advanceTimersByTimeAsync(1100);

		// Close before the next backoff timer (2000ms) can fire.
		ls.closeAll();
		vi.useRealTimers();

		expect(call).toBeGreaterThanOrEqual(2);
		expect(events.some(e => e.type === 'reconnected')).toBe(true);
	});

	test('does not reconnect after explicit close', async () => {
		vi.useFakeTimers();

		let call = 0;
		const client = mockClient(() => {
			call++;
			return Promise.resolve(makeHangingStream());
		});

		const ls = new LichessStream(client);
		ls.openEventStream(() => {});

		// Let it connect once
		await vi.runAllTimersAsync();

		ls.closeEventStream();

		// Advance well past any backoff — should not trigger a reconnect
		await vi.advanceTimersByTimeAsync(10_000);
		await vi.runAllTimersAsync();

		expect(call).toBe(1);
	});
});
