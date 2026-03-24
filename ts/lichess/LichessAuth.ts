// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqLocalStorage } from '../clvq/ClvqLocalStorage';
import { LichessError     } from './LichessError';

export type LichessUser = {
	id:       string;
	username: string;
	title?:   string;
	rating?:  number;
};

const StorageKey = {
	token:    'lichess_token',
	verifier: 'lichess_code_verifier',
	user:     'lichess_user',
} as const;

const LichessURL = {
	oauth:   'https://lichess.org/oauth',
	token:   'https://lichess.org/api/token',
	account: 'https://lichess.org/api/account',
} as const;

const ClientId = 'chesslovaquia';
const Scope    = 'board:play';

export class LichessAuth {
	private readonly storage: ClvqLocalStorage;

	constructor(storage: ClvqLocalStorage) {
		this.storage = storage;
	}

	// --- Public API ---

	public isLoggedIn(): boolean {
		return this.storage.getItem(StorageKey.token) !== '';
	}

	public getToken(): string {
		return this.storage.getItem(StorageKey.token);
	}

	public getUser(): LichessUser | null {
		const raw = this.storage.getItem(StorageKey.user);
		if (raw === '') return null;
		try {
			return JSON.parse(raw) as LichessUser;
		} catch {
			return null;
		}
	}

	public async login(): Promise<void> {
		const verifier   = this.generateVerifier();
		const challenge  = await this.generateChallenge(verifier);
		const redirectUri = this.getRedirectUri();

		this.storage.setItem(StorageKey.verifier, verifier);

		const params = new URLSearchParams({
			response_type:         'code',
			client_id:             ClientId,
			redirect_uri:          redirectUri,
			scope:                 Scope,
			code_challenge:        challenge,
			code_challenge_method: 'S256',
		});

		this.redirect(`${LichessURL.oauth}?${params.toString()}`);
	}

	public logout(): void {
		this.storage.removeItem(StorageKey.token);
		this.storage.removeItem(StorageKey.verifier);
		this.storage.removeItem(StorageKey.user);
	}

	public async handleCallback(): Promise<void> {
		const params = new URLSearchParams(window.location.search);
		const code   = params.get('code');
		if (!code) return;

		const verifier = this.storage.getItem(StorageKey.verifier);
		if (!verifier) {
			throw new LichessError('PKCE verifier missing from storage');
		}

		this.storage.removeItem(StorageKey.verifier);

		const token = await this.exchangeCode(code, verifier);
		this.storage.setItem(StorageKey.token, token);

		const user = await this.fetchProfile(token);
		this.storage.setItem(StorageKey.user, JSON.stringify(user));

		// Remove ?code= from the URL without reloading
		const clean = window.location.pathname;
		history.replaceState(null, '', clean);
	}

	protected redirect(url: string): void {
		window.location.href = url;
	}

	// --- Private helpers ---

	private generateVerifier(): string {
		const bytes = new Uint8Array(32);
		crypto.getRandomValues(bytes);
		return this.base64urlEncode(bytes);
	}

	private async generateChallenge(verifier: string): Promise<string> {
		const encoder = new TextEncoder();
		const data    = encoder.encode(verifier);
		const digest  = await crypto.subtle.digest('SHA-256', data);
		return this.base64urlEncode(new Uint8Array(digest));
	}

	private base64urlEncode(bytes: Uint8Array): string {
		let str = '';
		for (const b of bytes) {
			str += String.fromCharCode(b);
		}
		return btoa(str)
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
	}

	private getRedirectUri(): string {
		return window.location.origin + window.location.pathname;
	}

	private async exchangeCode(code: string, verifier: string): Promise<string> {
		const body = new URLSearchParams({
			grant_type:    'authorization_code',
			code:          code,
			redirect_uri:  this.getRedirectUri(),
			client_id:     ClientId,
			code_verifier: verifier,
		});

		const resp = await fetch(LichessURL.token, {
			method:  'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body:    body.toString(),
		});

		if (!resp.ok) {
			throw new LichessError(`Token exchange failed: ${resp.status}`);
		}

		const data = await resp.json() as { access_token?: string };
		if (!data.access_token) {
			throw new LichessError('Token exchange response missing access_token');
		}
		return data.access_token;
	}

	private async fetchProfile(token: string): Promise<LichessUser> {
		const resp = await fetch(LichessURL.account, {
			headers: { 'Authorization': `Bearer ${token}` },
		});

		if (!resp.ok) {
			throw new LichessError(`Profile fetch failed: ${resp.status}`);
		}

		const data = await resp.json() as {
			id:       string;
			username: string;
			title?:   string;
			perfs?:   { rapid?: { rating?: number } };
		};

		const user: LichessUser = {
			id:       data.id,
			username: data.username,
		};
		if (data.title) {
			user.title = data.title;
		}
		if (data.perfs?.rapid?.rating) {
			user.rating = data.perfs.rapid.rating;
		}
		return user;
	}
}
