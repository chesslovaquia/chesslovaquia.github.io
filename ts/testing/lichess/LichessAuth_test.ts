// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, beforeEach, afterEach, describe } from 'vitest';

import { ClvqLocalStorage } from '../../clvq/ClvqLocalStorage';
import { LichessAuth      } from '../../lichess/LichessAuth';
import { LichessError     } from '../../lichess/LichessError';

function newAuth(): LichessAuth {
	return new LichessAuth(new ClvqLocalStorage());
}

function stubLocation(overrides: Partial<Location>): void {
	vi.stubGlobal('location', {
		...window.location,
		origin:   'http://localhost',
		pathname: '/play/desktop/',
		search:   '',
		...overrides,
	});
}

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	localStorage.clear();
});

describe('LichessAuth.isLoggedIn', () => {
	test('false when no token', () => {
		expect(newAuth().isLoggedIn()).toBe(false);
	});

	test('true when token present', () => {
		localStorage.setItem('lichess_token', 'tok123');
		expect(newAuth().isLoggedIn()).toBe(true);
	});
});

describe('LichessAuth.getUser', () => {
	test('null when nothing stored', () => {
		expect(newAuth().getUser()).toBeNull();
	});

	test('returns parsed user when stored', () => {
		const user = { id: 'user1', username: 'User1', rating: 1500 };
		localStorage.setItem('lichess_user', JSON.stringify(user));
		const result = newAuth().getUser();
		expect(result).not.toBeNull();
		expect(result!.username).toBe('User1');
		expect(result!.rating).toBe(1500);
	});

	test('returns null on invalid JSON', () => {
		localStorage.setItem('lichess_user', 'not-json{');
		expect(newAuth().getUser()).toBeNull();
	});
});

describe('LichessAuth.getToken', () => {
	test('empty string when not set', () => {
		expect(newAuth().getToken()).toBe('');
	});

	test('returns stored token', () => {
		localStorage.setItem('lichess_token', 'mytoken');
		expect(newAuth().getToken()).toBe('mytoken');
	});
});

describe('LichessAuth.logout', () => {
	test('clears token, verifier, and user from localStorage', () => {
		localStorage.setItem('lichess_token',         'tok');
		localStorage.setItem('lichess_code_verifier', 'ver');
		localStorage.setItem('lichess_user',          '{}');

		newAuth().logout();

		expect(localStorage.getItem('lichess_token')).toBeNull();
		expect(localStorage.getItem('lichess_code_verifier')).toBeNull();
		expect(localStorage.getItem('lichess_user')).toBeNull();
	});
});

describe('LichessAuth.login', () => {
	test('stores code_verifier and builds correct oauth redirect URL', async () => {
		stubLocation({ search: '' });
		const auth = newAuth();
		let capturedURL = '';
		vi.spyOn(auth as any, 'redirect').mockImplementation((url: unknown) => {
			capturedURL = url as string;
		});

		await auth.login();

		expect(localStorage.getItem('lichess_code_verifier')).not.toBeNull();
		expect(capturedURL).toContain('lichess.org/oauth');
		expect(capturedURL).toContain('code_challenge_method=S256');
		expect(capturedURL).toContain('scope=board%3Aplay');
		expect(capturedURL).toContain('client_id=chesslovaquia');
	});
});

describe('LichessAuth.handleCallback', () => {
	test('does nothing when no ?code= in URL', async () => {
		stubLocation({ search: '' });
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		await newAuth().handleCallback();
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	test('exchanges code for token and stores user', async () => {
		localStorage.setItem('lichess_code_verifier', 'test-verifier');
		stubLocation({ search: '?code=authcode123' });

		const replaceStateSpy = vi.spyOn(history, 'replaceState');

		vi.spyOn(globalThis, 'fetch')
			.mockResolvedValueOnce(new Response(
				JSON.stringify({ access_token: 'tok-abc' }),
				{ status: 200 },
			))
			.mockResolvedValueOnce(new Response(
				JSON.stringify({
					id:       'user1',
					username: 'User1',
					perfs:    { rapid: { rating: 1800 } },
				}),
				{ status: 200 },
			));

		await newAuth().handleCallback();

		expect(globalThis.fetch).toHaveBeenCalledTimes(2);
		expect(localStorage.getItem('lichess_token')).toBe('tok-abc');
		expect(localStorage.getItem('lichess_code_verifier')).toBeNull();

		const storedUser = JSON.parse(localStorage.getItem('lichess_user') ?? 'null');
		expect(storedUser.username).toBe('User1');
		expect(storedUser.rating).toBe(1800);

		expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/play/desktop/');
	});

	test('throws LichessError when verifier missing', async () => {
		stubLocation({ search: '?code=authcode123' });
		await expect(newAuth().handleCallback()).rejects.toBeInstanceOf(LichessError);
	});
});
