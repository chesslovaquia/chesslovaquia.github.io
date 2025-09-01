// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export class EngineError extends Error {
	constructor(msg) {
		super(`Engine ERROR: ${msg}`);
	}
}
