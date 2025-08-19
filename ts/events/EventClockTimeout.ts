// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Color } from '../game/types';

const eventName:   string      = 'clvqClockTimeout';
const eventTarget: EventTarget = document as EventTarget;

export class EventClockTimeout extends CustomEvent<{ color: Color }> {
	static Name:   string      = eventName;
	static Target: EventTarget = eventTarget;

	constructor(color: Color) {
		super(eventName, {
			detail: { color: color },
		});
	}
}
