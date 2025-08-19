// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export class GameError extends Error {
	constructor(msg) {
		super(`Game ERROR: ${msg}`);
	}
}
