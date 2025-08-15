// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import * as cg from 'chessground/types';

export type BoardMoveData = {orig: cg.Key, dest: cg.Key, meta?: cg.MoveMetadata};

export class EventBoardMove extends CustomEvent<BoardMoveData> {
	constructor(data: BoardMoveData) {
		super('clvqBoardMove', {
			detail: data,
		});
	}
}
