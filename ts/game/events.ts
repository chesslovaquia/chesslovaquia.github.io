// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

type Color = 'w' | 'b';

class ClockTimeout extends CustomEvent<{ color: Color }> {
	constructor(color: Color) {
		super('clockTimeout', {
			detail: { color: color },
		});
	}
}

export {
	ClockTimeout,
}
