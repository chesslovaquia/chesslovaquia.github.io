// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export class ConfigError extends Error {
	constructor(msg: string) {
		super(`Config ERROR: ${msg}`);
	}
}

export function requireElement(el: HTMLElement | null, name: string): HTMLElement {
	if (!el) {
		throw new ConfigError(`${name} not found.`);
	}
	return el;
}
