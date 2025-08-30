// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { BoardDests } from '../board/GameBoard';
import { BoardMove  } from '../board/GameBoard';

export type EngineColor = 'b' | 'w';

export interface GameEngine {
	turn():            EngineColor;
	reset():           void;
	fen():             string;
	inCheck():         boolean;
	possibleDests():   BoardDests;
	lastMove():        BoardMove | undefined;
	isPromotion():     boolean;
	history():         string[];
	move(san: string): BoardMove | null;
}
