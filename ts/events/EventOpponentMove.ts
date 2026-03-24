// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { EngineMove } from '../engine/GameEngine';

const eventName:   string      = 'clvqOpponentMove';
const eventTarget: EventTarget = document as EventTarget;

export class EventOpponentMove extends CustomEvent<EngineMove> {
	static Name:   string      = eventName;
	static Target: EventTarget = eventTarget;

	constructor(data: EngineMove) {
		super(eventName, {
			detail: data,
		});
	}
}
