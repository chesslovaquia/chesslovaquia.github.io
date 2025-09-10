// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { BoardDests          } from '../board/GameBoard';
import { BoardMove           } from '../board/GameBoard';
import { BoardSquare         } from '../board/GameBoard';
import { BoardPiece          } from '../board/GameBoard';
import { BoardPromotionPiece } from '../board/GameBoard';

export type EngineColor = 'b' | 'w';

export type MovesSAN = string[];

export type EngineMove = {
	from:      BoardSquare,
	to:        BoardSquare,
	promotion: BoardPromotionPiece,
};

export interface GameEngine {
	turn():                   EngineColor;
	fen():                    string;
	possibleDests():          BoardDests;
	lastMove():               BoardMove | undefined;
	isPromotion():            boolean;
	move(m: EngineMove):      BoardMove | undefined;
	undo():                   BoardMove | undefined;
	isGameOver():             boolean;
	isCheckmate():            boolean;
	isDraw():                 boolean;
	isStalemate():            boolean;
	isThreefoldRepetition():  boolean;
	isInsufficientMaterial(): boolean;
	getState():               MovesSAN;
	setState(m: MovesSAN):    void;
	capturedPiece():          BoardPiece | undefined;
}
