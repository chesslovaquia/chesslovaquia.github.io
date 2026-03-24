// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, afterEach, describe } from 'vitest';

import { LichessAuth   } from '../../lichess/LichessAuth';
import { LichessClient } from '../../lichess/LichessClient';
import { LichessError  } from '../../lichess/LichessError';

function mockAuth(token = 'test-token'): LichessAuth {
	return { getToken: () => token } as unknown as LichessAuth;
}

function newClient(token = 'test-token'): LichessClient {
	return new LichessClient(mockAuth(token));
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('LichessClient.get', () => {
	test('injects Authorization header', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response('{}', { status: 200 }),
		);
		await newClient('mytoken').get('/api/test');
		expect(globalThis.fetch).toHaveBeenCalledWith(
			'https://lichess.org/api/test',
			expect.objectContaining({
				headers: expect.objectContaining({ 'Authorization': 'Bearer mytoken' }),
			}),
		);
	});

	test('throws LichessError on non-ok response', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response('', { status: 500 }),
		);
		await expect(newClient().get('/api/test')).rejects.toBeInstanceOf(LichessError);
	});

	test('throws rate-limit LichessError on 429', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response('', { status: 429 }),
		);
		await expect(newClient().get('/api/test')).rejects.toSatisfy(
			(e: unknown) => e instanceof LichessError && (e as Error).message.includes('429'),
		);
	});
});

describe('LichessClient.post', () => {
	test('sends body with correct Content-Type', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response('{}', { status: 200 }),
		);
		const body = new URLSearchParams({ key: 'value' });
		await newClient().post('/api/test', body);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			'https://lichess.org/api/test',
			expect.objectContaining({
				method:  'POST',
				body,
				headers: expect.objectContaining({
					'Content-Type': 'application/x-www-form-urlencoded',
				}),
			}),
		);
	});

	test('throws LichessError on failure', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response('', { status: 400 }),
		);
		await expect(newClient().post('/api/test')).rejects.toBeInstanceOf(LichessError);
	});

	test('throws rate-limit LichessError on 429', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response('', { status: 429 }),
		);
		await expect(newClient().post('/api/test')).rejects.toSatisfy(
			(e: unknown) => e instanceof LichessError && (e as Error).message.includes('429'),
		);
	});
});

describe('LichessClient.getStream', () => {
	test('returns response body ReadableStream', async () => {
		const stream = new ReadableStream<Uint8Array>();
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(stream, { status: 200 }),
		);
		const result = await newClient().getStream('/api/stream/event');
		expect(result).toBeInstanceOf(ReadableStream);
	});

	test('injects Authorization header', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response(new ReadableStream(), { status: 200 }),
		);
		await newClient('streamtok').getStream('/api/stream/event');
		expect(globalThis.fetch).toHaveBeenCalledWith(
			'https://lichess.org/api/stream/event',
			expect.objectContaining({
				headers: expect.objectContaining({ 'Authorization': 'Bearer streamtok' }),
			}),
		);
	});
});
