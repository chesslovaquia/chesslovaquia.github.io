// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { streamNdjson } from './stream';

/** Build a ReadableStream that yields the given chunks as UTF-8 bytes. */
function makeBodyStream(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(enc.encode(chunk));
      }
      controller.close();
    },
  });
}

describe('streamNdjson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses a single-line NDJSON stream', async () => {
    const body = makeBodyStream(['{"type":"ping"}\n']);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, { status: 200 })
    );

    const events: unknown[] = [];
    const controller = new AbortController();
    await streamNdjson('https://lichess.org/test', 'tok', (e) => events.push(e), controller.signal);

    expect(events).toEqual([{ type: 'ping' }]);
  });

  it('parses multiple lines from a single chunk', async () => {
    const body = makeBodyStream(['{"a":1}\n{"b":2}\n{"c":3}\n']);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, { status: 200 })
    );

    const events: unknown[] = [];
    const controller = new AbortController();
    await streamNdjson('https://lichess.org/test', 'tok', (e) => events.push(e), controller.signal);

    expect(events).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('handles lines split across multiple chunks', async () => {
    const body = makeBodyStream(['{"ty', 'pe":"ping"}', '\n']);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, { status: 200 })
    );

    const events: unknown[] = [];
    const controller = new AbortController();
    await streamNdjson('https://lichess.org/test', 'tok', (e) => events.push(e), controller.signal);

    expect(events).toEqual([{ type: 'ping' }]);
  });

  it('skips empty lines', async () => {
    const body = makeBodyStream(['\n\n{"type":"ping"}\n\n']);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, { status: 200 })
    );

    const events: unknown[] = [];
    const controller = new AbortController();
    await streamNdjson('https://lichess.org/test', 'tok', (e) => events.push(e), controller.signal);

    expect(events).toEqual([{ type: 'ping' }]);
  });

  it('throws on non-OK HTTP status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('forbidden', { status: 403 })
    );

    const controller = new AbortController();
    await expect(
      streamNdjson('https://lichess.org/test', 'tok', () => {}, controller.signal)
    ).rejects.toThrow('403');
  });
});
