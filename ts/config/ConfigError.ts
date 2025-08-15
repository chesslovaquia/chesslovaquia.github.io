// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class ConfigError extends Error {
	constructor(msg) {
		super(`Config ERROR: ${msg}`);
	}
}

export { ConfigError };
