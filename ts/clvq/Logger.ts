// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export class Logger {
	private readonly debugEnabled: boolean;

	constructor(debugEnabled: boolean = false) {
		this.debugEnabled = debugEnabled;
	}

	debug(...args: unknown[]): void {
		if (this.debugEnabled) console.debug(...args);
	}

	warn(...args: unknown[]): void {
		console.warn(...args);
	}

	error(...args: unknown[]): void {
		console.error(...args);
	}
}

function isDebugEnabled(): boolean {
	try {
		return localStorage.getItem('clvq.debug') === '1';
	} catch {
		return false;
	}
}

export const logger = new Logger(isDebugEnabled());
