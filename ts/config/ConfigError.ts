// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export class ConfigError extends Error {
	constructor(msg: string) {
		super(`Config ERROR: ${msg}`);
	}
}
