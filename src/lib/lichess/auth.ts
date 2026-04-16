// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LS_LICHESS_PENDING_PREFIX } from '../config';
import { saveAccount, getAllAccounts } from '../accounts';
import type { Account } from '../accounts';
import { logger } from '../logger';

const LICHESS_BASE = 'https://lichess.org';
const CLIENT_ID = 'chesslovaquia';
const SCOPE = 'board:play';

/** Encode a Uint8Array as base64url (no padding). */
export function base64url(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Compute SHA-256 of a UTF-8 string, returned as Uint8Array. */
export async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

/** Generate a cryptographically random base64url string (32 random bytes). */
function randomVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/**
 * Initiate a lichess OAuth PKCE flow.
 * Generates a pending auth ID, stores the code verifier, and redirects to lichess.
 */
export async function startAuth(redirectUri: string): Promise<void> {
  const pendingId = crypto.randomUUID();
  const codeVerifier = randomVerifier();
  const challengeBytes = await sha256(codeVerifier);
  const codeChallenge = base64url(challengeBytes);

  localStorage.setItem(LS_LICHESS_PENDING_PREFIX + pendingId, codeVerifier);
  logger.debug('lichess auth start', pendingId);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: SCOPE,
    state: pendingId,
  });
  window.location.href = `${LICHESS_BASE}/oauth?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

interface LichessProfile {
  id: string;
  username: string;
}

/**
 * Complete the OAuth PKCE flow after the redirect callback.
 * Exchanges the authorization code for a token, fetches the user profile,
 * and saves (or updates) the Account record in IndexedDB.
 */
export async function completeAuth(
  code: string,
  state: string,
  redirectUri: string
): Promise<Account> {
  const verifierKey = LS_LICHESS_PENDING_PREFIX + state;
  const codeVerifier = localStorage.getItem(verifierKey);
  if (!codeVerifier) {
    throw new Error('No pending lichess auth for state: ' + state);
  }

  const tokenBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier,
  });

  const tokenRes = await fetch(`${LICHESS_BASE}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`Lichess token exchange failed: ${tokenRes.status}`);
  }
  const tokenData = (await tokenRes.json()) as TokenResponse;
  const accessToken = tokenData.access_token;

  const profileRes = await fetch(`${LICHESS_BASE}/api/account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) {
    throw new Error(`Lichess profile fetch failed: ${profileRes.status}`);
  }
  const profile = (await profileRes.json()) as LichessProfile;

  localStorage.removeItem(verifierKey);
  logger.debug('lichess auth complete', profile.username);

  // Reuse existing record for the same handle (token refresh flow).
  const all = await getAllAccounts();
  const existing = all.find(
    (a) => a.network === 'lichess' && a.handle === profile.username
  );

  const account: Account = {
    id: existing?.id ?? crypto.randomUUID(),
    network: 'lichess',
    displayName: profile.username,
    handle: profile.username,
    credentials: { accessToken, refreshToken: null, expiresAt: null },
    createdAt: existing?.createdAt ?? Date.now(),
  };
  await saveAccount(account);
  return account;
}

/**
 * Revoke the lichess access token. Best-effort — failure is non-fatal.
 * Call before removing a lichess Account so lichess also clears the session.
 */
export async function revokeToken(account: Account): Promise<void> {
  const token = account.credentials?.accessToken;
  if (!token) return;
  try {
    await fetch(`${LICHESS_BASE}/api/token`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    logger.debug('lichess token revoked', account.handle);
  } catch (err) {
    logger.warn('lichess token revoke failed (non-fatal)', err);
  }
}
