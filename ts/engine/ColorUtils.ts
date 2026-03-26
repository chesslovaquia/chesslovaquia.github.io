// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { EngineColor } from './GameEngine';
import { BoardColor  } from '../board/GameBoard';

export type BySide<T> = Record<EngineColor, T>;

export function toBoard(color: EngineColor): BoardColor {
	return color === 'w' ? 'white' : 'black';
}

export function toEngine(color: BoardColor): EngineColor {
	return color === 'white' ? 'w' : 'b';
}
