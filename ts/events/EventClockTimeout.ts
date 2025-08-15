// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Color } from '../game/types';

class EventClockTimeout extends CustomEvent<{ color: Color }> {
	constructor(color: Color) {
		super('clvqClockTimeout', {
			detail: { color: color },
		});
	}
}

export { EventClockTimeout }
