// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import * as cg from 'chessground/types';

//
// BoardMove
//

export type BoardMoveData = {orig: cg.Key, dest: cg.Key, gotPiece?: cg.Piece};

export class BoardMoveEvent extends CustomEvent<BoardMoveData> {
	constructor(data: BoardMoveData) {
		super('clvqBoardMove', {
			detail: data,
		});
	}
}

//
// BoardAfterMove
//

export type BoardAfterMoveData = {orig: cg.Key, dest: cg.Key, meta?: cg.MoveMetadata};

export class BoardAfterMoveEvent extends CustomEvent<BoardAfterMoveData> {
	constructor(data: BoardAfterMoveData) {
		super('clvqBoardAfterMove', {
			detail: data,
		});
	}
}
