// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import * as cg from 'chessground/types';

export type BoardAfterMoveData = {orig: cg.Key, dest: cg.Key, meta?: cg.MoveMetadata};

export class EventBoardAfterMove extends CustomEvent<BoardAfterMoveData> {
	constructor(data: BoardAfterMoveData) {
		super('clvqBoardAfterMove', {
			detail: data,
		});
	}
}
