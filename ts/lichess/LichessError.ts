// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqError } from '../clvq/ClvqError';

export class LichessError extends ClvqError {
	constructor(msg: string) {
		super(msg);
	}
}
