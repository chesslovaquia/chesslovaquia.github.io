// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { logger } from '../logger';

const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
/** A connection that lasts at least this long is considered "stable" — reset backoff. */
const STABLE_THRESHOLD_MS = 10_000;

/**
 * Read a single NDJSON stream to completion (or until the signal is aborted).
 * Calls `onEvent` for each non-empty JSON line.
 * Throws on network errors or non-OK HTTP status.
 */
export async function streamNdjson<T>(
  url: string,
  token: string,
  onEvent: (e: T) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`Stream HTTP ${res.status}: ${url}`);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let leftover = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = leftover + value;
      const lines = chunk.split('\n');
      leftover = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          onEvent(JSON.parse(trimmed) as T);
        } catch (err) {
          logger.warn('ndjson parse error', trimmed, err);
        }
      }
    }
    // Flush any remaining buffer
    if (leftover.trim()) {
      try {
        onEvent(JSON.parse(leftover.trim()) as T);
      } catch {
        // Incomplete line at EOF — ignore
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Open a self-reconnecting NDJSON stream with exponential backoff.
 * Reconnect counter resets after STABLE_THRESHOLD_MS of stable connection.
 * Returns a cancel function; call it to stop reconnecting and abort the current stream.
 */
export function reconnectingStream<T>(
  url: string,
  token: string,
  onEvent: (e: T) => void,
  onError?: (err: unknown) => void
): () => void {
  const controller = new AbortController();
  let cancelled = false;
  let backoffMs = MIN_BACKOFF_MS;

  async function loop(): Promise<void> {
    while (!cancelled) {
      const startedAt = Date.now();
      try {
        logger.debug('stream open', url);
        await streamNdjson<T>(url, token, onEvent, controller.signal);
        logger.debug('stream closed', url);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        onError?.(err);
        logger.warn('stream error, reconnecting in', backoffMs, 'ms', err);
      }
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      backoffMs = elapsed >= STABLE_THRESHOLD_MS
        ? MIN_BACKOFF_MS
        : Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      await new Promise<void>((resolve) => {
        const t = setTimeout(resolve, backoffMs);
        controller.signal.addEventListener('abort', () => { clearTimeout(t); resolve(); });
      });
    }
  }

  loop().catch((err: unknown) => logger.error('stream fatal', err));

  return () => {
    cancelled = true;
    controller.abort();
    logger.debug('stream cancelled', url);
  };
}
