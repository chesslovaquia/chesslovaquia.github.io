// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameBoard } from '../board/GameBoard';

import { GameEngine } from '../engine/GameEngine';

import { GameConfig   } from './GameConfig';
import { GameClock    } from './GameClock';
import { GameNavigate } from './GameNavigate';
import { GameState    } from './GameState';

export type GameDeps = {
	cfg:    GameConfig,
	engine: GameEngine,
	board:  GameBoard,
	clock:  GameClock,
	nav:    GameNavigate,
	state:  GameState,
};
