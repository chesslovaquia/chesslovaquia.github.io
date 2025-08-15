// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class GameError extends Error {
	constructor(msg) {
		super(`Game ERROR: ${msg}`);
	}
}
export { GameError };
