// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import * as cg from 'chessground/types';

const eventName:   string      = 'clvqBoardMove';
const eventTarget: EventTarget = document as EventTarget;

export type BoardMoveData = {orig: cg.Key, dest: cg.Key, meta?: cg.MoveMetadata};

export class EventBoardMove extends CustomEvent<BoardMoveData> {
	static Name:   string      = eventName;
	static Target: EventTarget = eventTarget;

	constructor(data: BoardMoveData) {
		super(eventName, {
			detail: data,
		});
	}
}
