// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export type GameOverDetail = {
	reason:  string;
	winner?: 'white' | 'black';
};

const eventName:   string      = 'clvqGameOver';
const eventTarget: EventTarget = document as EventTarget;

export class EventGameOver extends CustomEvent<GameOverDetail> {
	static Name:   string      = eventName;
	static Target: EventTarget = eventTarget;

	constructor(data: GameOverDetail) {
		super(eventName, {
			detail: data,
		});
	}
}
