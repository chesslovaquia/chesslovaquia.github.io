// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LichessAuth  } from './LichessAuth';
import { LichessError } from './LichessError';

const BaseURL = 'https://lichess.org';

export class LichessClient {
	private readonly auth: LichessAuth;

	constructor(auth: LichessAuth) {
		this.auth = auth;
	}

	public async get(path: string): Promise<Response> {
		return this.request('GET', path);
	}

	public async post(path: string, body?: URLSearchParams): Promise<Response> {
		const extra: Record<string, string> = {};
		if (body !== undefined) {
			extra['Content-Type'] = 'application/x-www-form-urlencoded';
		}
		return this.request('POST', path, body, false, extra);
	}

	public async getStream(path: string): Promise<ReadableStream<Uint8Array>> {
		const resp = await this.request('GET', path, undefined, true);
		if (!resp.body) {
			throw new LichessError(`Stream response has no body: ${path}`);
		}
		return resp.body;
	}

	private buildHeaders(extra: Record<string, string> = {}): HeadersInit {
		return {
			'Authorization': `Bearer ${this.auth.getToken()}`,
			...extra,
		};
	}

	private async request(
		method:  string,
		path:    string,
		body?:   BodyInit,
		stream?: boolean,
		extra:   Record<string, string> = {},
	): Promise<Response> {
		const resp = await fetch(BaseURL + path, {
			method,
			headers: this.buildHeaders(extra),
			body,
		});

		if (!stream) {
			if (resp.status === 429) {
				throw new LichessError('Rate limited (HTTP 429)');
			}
			if (!resp.ok) {
				throw new LichessError(`Request failed: ${resp.status} ${path}`);
			}
		}

		return resp;
	}
}
