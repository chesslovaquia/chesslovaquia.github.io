// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { logger } from '../logger';

const LICHESS_BASE = 'https://lichess.org';

export class LichessError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'LichessError';
  }
}

/**
 * Thin HTTP wrapper for the lichess API.
 * Injects the bearer token on every request and handles HTTP 429 with one retry.
 */
export class LichessClient {
  readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.token}` };
  }

  private async withRetry(
    doFetch: () => Promise<Response>,
    signal?: AbortSignal
  ): Promise<Response> {
    const res = await doFetch();
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10);
      logger.warn('lichess 429, retrying after', retryAfter, 's');
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, retryAfter * 1000);
        signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); });
      });
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const retried = await doFetch();
      if (!retried.ok) throw new LichessError(retried.status, `HTTP ${retried.status}`);
      return retried;
    }
    if (!res.ok) throw new LichessError(res.status, `HTTP ${res.status}`);
    return res;
  }

  async get(path: string, signal?: AbortSignal): Promise<Response> {
    const doFetch = () =>
      fetch(`${LICHESS_BASE}${path}`, {
        headers: this.authHeaders(),
        signal,
      });
    return this.withRetry(doFetch, signal);
  }

  /**
   * POST with an optional form-encoded body and optional AbortSignal.
   * For streaming endpoints (e.g. /api/board/seek), pass a signal and do not
   * await the response body — the connection stays alive until the signal fires.
   */
  async post(path: string, body?: URLSearchParams, signal?: AbortSignal): Promise<Response> {
    const headers: Record<string, string> = {
      ...this.authHeaders(),
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    };
    const doFetch = () =>
      fetch(`${LICHESS_BASE}${path}`, {
        method: 'POST',
        headers,
        body: body?.toString(),
        signal,
      });
    return this.withRetry(doFetch, signal);
  }

  async delete(path: string): Promise<Response> {
    const doFetch = () =>
      fetch(`${LICHESS_BASE}${path}`, {
        method: 'DELETE',
        headers: this.authHeaders(),
      });
    return this.withRetry(doFetch);
  }
}
