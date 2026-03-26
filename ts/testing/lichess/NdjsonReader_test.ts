// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, expect, describe } from 'vitest';

import { readNdjson  } from '../../lichess/NdjsonReader';
import { LichessError } from '../../lichess/LichessError';

function makeNdjsonStream(lines: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	const data = encoder.encode(lines.join('\n') + '\n');
	return new ReadableStream({
		start(ctrl) {
			ctrl.enqueue(data);
			ctrl.close();
		},
	});
}

function makeChunkedStream(chunks: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	return new ReadableStream({
		start(ctrl) {
			for (const chunk of chunks) {
				ctrl.enqueue(encoder.encode(chunk));
			}
			ctrl.close();
		},
	});
}

// --- happy path ---

describe('readNdjson happy path', () => {
	test('calls onLine for each valid JSON line', async () => {
		const lines = [
			JSON.stringify({ type: 'a' }),
			JSON.stringify({ type: 'b' }),
			JSON.stringify({ type: 'c' }),
		];
		const results: unknown[] = [];
		await readNdjson(makeNdjsonStream(lines), (v) => results.push(v));
		expect(results).toHaveLength(3);
		expect(results[0]).toEqual({ type: 'a' });
		expect(results[1]).toEqual({ type: 'b' });
		expect(results[2]).toEqual({ type: 'c' });
	});

	test('skips blank lines', async () => {
		const encoder = new TextEncoder();
		const raw = '\n{"type":"x"}\n\n{"type":"y"}\n';
		const stream = new ReadableStream({
			start(ctrl) {
				ctrl.enqueue(encoder.encode(raw));
				ctrl.close();
			},
		});
		const results: unknown[] = [];
		await readNdjson(stream, (v) => results.push(v));
		expect(results).toHaveLength(2);
	});
});

// --- chunked input ---

describe('readNdjson chunked input', () => {
	test('correctly parses lines split across chunks', async () => {
		// Split JSON object across two chunks
		const chunks = ['{"type":', '"split"}\n'];
		const results: unknown[] = [];
		await readNdjson(makeChunkedStream(chunks), (v) => results.push(v));
		expect(results).toHaveLength(1);
		expect(results[0]).toEqual({ type: 'split' });
	});
});

// --- error handling ---

describe('readNdjson onError strategy', () => {
	test("onError:'skip' skips invalid lines and parses valid ones", async () => {
		const lines = [
			JSON.stringify({ id: 1 }),
			'not-valid-json',
			JSON.stringify({ id: 2 }),
		];
		const results: unknown[] = [];
		await readNdjson(
			makeNdjsonStream(lines),
			(v) => results.push(v),
			{ onError: 'skip' },
		);
		expect(results).toHaveLength(2);
		expect(results[0]).toEqual({ id: 1 });
		expect(results[1]).toEqual({ id: 2 });
	});

	test("onError:'throw' throws LichessError on invalid JSON", async () => {
		const lines = [
			JSON.stringify({ id: 1 }),
			'not-valid-json',
		];
		await expect(
			readNdjson(makeNdjsonStream(lines), () => {}, { onError: 'throw' }),
		).rejects.toBeInstanceOf(LichessError);
	});

	test('default error strategy is throw', async () => {
		const lines = ['bad-json'];
		await expect(
			readNdjson(makeNdjsonStream(lines), () => {}),
		).rejects.toBeInstanceOf(LichessError);
	});
});

// --- abort signal ---

describe('readNdjson abort signal', () => {
	test('resolves cleanly when signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();

		const results: unknown[] = [];
		await expect(
			readNdjson(
				makeNdjsonStream([JSON.stringify({ id: 1 }), JSON.stringify({ id: 2 })]),
				(v) => results.push(v),
				{ signal: controller.signal },
			),
		).resolves.toBeUndefined();
	});

	test('stops reading next chunk when aborted after first line', async () => {
		const encoder = new TextEncoder();
		const controller = new AbortController();
		let pullCount = 0;

		// Pull-based infinite stream — yields one line per pull.
		// After reader.cancel() the stream stops being pulled.
		const stream = new ReadableStream<Uint8Array>({
			pull(ctrl) {
				pullCount++;
				ctrl.enqueue(encoder.encode(JSON.stringify({ id: pullCount }) + '\n'));
			},
		});

		const results: unknown[] = [];
		await readNdjson(
			stream,
			(v) => {
				results.push(v);
				controller.abort();
			},
			{ signal: controller.signal },
		);

		expect(results).toHaveLength(1);
	});
});
