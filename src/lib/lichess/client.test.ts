// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LichessClient, LichessError } from './client';

describe('LichessClient', () => {
  const token = 'test-token-abc';
  let client: LichessClient;

  beforeEach(() => {
    client = new LichessClient(token);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes the token publicly', () => {
    expect(client.token).toBe(token);
  });

  it('injects Authorization header on GET', async () => {
    let capturedHeaders: HeadersInit | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      capturedHeaders = init?.headers;
      return new Response('{}', { status: 200 });
    });

    await client.get('/api/account');
    expect(capturedHeaders).toBeDefined();
    const headers = new Headers(capturedHeaders as HeadersInit);
    expect(headers.get('Authorization')).toBe(`Bearer ${token}`);
  });

  it('throws LichessError on non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('forbidden', { status: 403 })
    );
    await expect(client.get('/api/account')).rejects.toBeInstanceOf(LichessError);
  });

  it('LichessError carries the HTTP status code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('not found', { status: 404 })
    );
    const err = await client.get('/api/account').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(LichessError);
    expect((err as LichessError).status).toBe(404);
  });

  it('retries once after Retry-After delay on 429', async () => {
    vi.useFakeTimers();
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return new Response('rate limited', {
          status: 429,
          headers: { 'Retry-After': '1' },
        });
      }
      return new Response('{}', { status: 200 });
    });

    const promise = client.get('/api/account');
    await vi.advanceTimersByTimeAsync(1100);
    await promise;

    expect(callCount).toBe(2);
    vi.useRealTimers();
  });

  it('throws LichessError if retry also fails', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('rate limited', {
        status: 429,
        headers: { 'Retry-After': '1' },
      })
    );

    const promise = client.get('/api/account').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1100);
    const err = await promise;

    expect(err).toBeInstanceOf(LichessError);
    vi.useRealTimers();
  });

  it('POST sets Content-Type when body is provided', async () => {
    let capturedHeaders: HeadersInit | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      capturedHeaders = init?.headers;
      return new Response('{}', { status: 200 });
    });

    await client.post('/api/board/seek', new URLSearchParams({ rated: 'false' }));
    const headers = new Headers(capturedHeaders as HeadersInit);
    expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
  });
});
