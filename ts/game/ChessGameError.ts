// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class ChessGameError extends Error {
	constructor(msg) {
		super(`Game ERROR: ${msg}`);
	}
}
export { ChessGameError };
