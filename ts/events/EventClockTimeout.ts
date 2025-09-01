// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { EngineColor } from '../engine/GameEngine';

const eventName:   string      = 'clvqClockTimeout';
const eventTarget: EventTarget = document as EventTarget;

export class EventClockTimeout extends CustomEvent<{ color: EngineColor }> {
	static Name:   string      = eventName;
	static Target: EventTarget = eventTarget;

	constructor(color: EngineColor) {
		super(eventName, {
			detail: { color: color },
		});
	}
}
