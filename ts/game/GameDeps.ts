// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessgroundBoard } from '../board/ChessgroundBoard';

import { ChessjsEngine } from '../engine/ChessjsEngine';

import { GameBoard } from '../board/GameBoard';

import { GameEngine } from '../engine/GameEngine';

import { GameConfig    } from './GameConfig';
import { GameClock     } from './GameClock';
import { GameNavigate  } from './GameNavigate';
import { GameState     } from './GameState';
import { GameStateImpl } from './GameState';

export type GameDeps = {
	cfg:    GameConfig,
	engine: GameEngine,
	board:  GameBoard,
	clock:  GameClock,
	nav:    GameNavigate,
	state:  GameState,
};

export function newGameDeps(boardUI: HTMLElement): GameDeps {
	const cfg = new GameConfig(boardUI);
	const engine = new ChessjsEngine();
	const board = new ChessgroundBoard(cfg, engine);
	const clock = new GameClock(cfg.ui, engine);
	const nav = new GameNavigate(cfg.ui, board, engine);
	const state = new GameStateImpl(engine, clock, nav);
	return {
		cfg: cfg,
		engine: engine,
		board: board,
		clock: clock,
		nav: nav,
		state: state,
	};
}
