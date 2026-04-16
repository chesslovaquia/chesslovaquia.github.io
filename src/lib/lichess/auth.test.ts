// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { base64url, sha256, completeAuth } from './auth';
import { LS_LICHESS_PENDING_PREFIX } from '../config';

describe('base64url', () => {
  it('encodes bytes as base64url without padding', () => {
    // 0xff 0xff 0xff → base64 "////" → base64url "____" (no padding)
    const bytes = new Uint8Array([0xff, 0xff, 0xff]);
    expect(base64url(bytes)).toBe('____');
  });

  it('replaces + with - and / with _', () => {
    // 0xfb → last byte produces '+' in standard base64 depending on context
    const bytes = new Uint8Array([0xfb, 0xef]);
    const encoded = base64url(bytes);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('produces non-empty output for non-empty input', () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const encoded = base64url(bytes);
    expect(encoded.length).toBeGreaterThan(0);
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/);
  });
});

describe('sha256', () => {
  it('returns a 32-byte hash for any input', async () => {
    const hash = await sha256('hello');
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await sha256('foo');
    const b = await sha256('bar');
    expect(a).not.toEqual(b);
  });

  it('produces the same hash for the same input', async () => {
    const a = await sha256('deterministic');
    const b = await sha256('deterministic');
    expect(a).toEqual(b);
  });
});

describe('completeAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('throws when no pending verifier exists for the state', async () => {
    await expect(
      completeAuth('code123', 'nonexistent-state', 'http://localhost/settings/')
    ).rejects.toThrow('No pending lichess auth');
  });

  it('clears the pending verifier key after successful exchange', async () => {
    const pendingId = 'test-pending-id';
    localStorage.setItem(LS_LICHESS_PENDING_PREFIX + pendingId, 'test-verifier');

    const mockTokenResponse = { access_token: 'tok123', token_type: 'Bearer' };
    const mockProfile = { id: 'alice', username: 'alice' };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('/api/token')) {
        return new Response(JSON.stringify(mockTokenResponse), { status: 200 });
      }
      if (url.includes('/api/account')) {
        return new Response(JSON.stringify(mockProfile), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    });

    const account = await completeAuth('auth-code', pendingId, 'http://localhost/settings/');

    expect(account.network).toBe('lichess');
    expect(account.handle).toBe('alice');
    expect(account.credentials?.accessToken).toBe('tok123');
    expect(localStorage.getItem(LS_LICHESS_PENDING_PREFIX + pendingId)).toBeNull();

    vi.restoreAllMocks();
  });
});
