// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { BoardMove } from '../board/GameBoard';

const eventName:   string      = 'clvqBoardMove';
const eventTarget: EventTarget = document as EventTarget;

export class EventBoardMove extends CustomEvent<BoardMove> {
	static Name:   string      = eventName;
	static Target: EventTarget = eventTarget;

	constructor(data: BoardMove) {
		super(eventName, {
			detail: data,
		});
	}
}
