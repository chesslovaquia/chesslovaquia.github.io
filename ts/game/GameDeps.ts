// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessgroundBoard } from '../board/ChessgroundBoard';

import { ChessjsEngine } from '../engine/ChessjsEngine';

import { GameBoard  } from '../board/GameBoard';
import { BoardColor } from '../board/GameBoard';

import { GameEngine } from '../engine/GameEngine';

import { GameCaptures  } from './GameCaptures';
import { GameConfig    } from './GameConfig';
import { GameClock     } from './GameClock';
import { GameHistory   } from './GameHistory';
import { GameNavigate  } from './GameNavigate';
import { GameSetup     } from './GameSetup';
import { GameState     } from './GameState';
import { GameStateImpl } from './GameState';

export type GameDeps = {
	cfg:          GameConfig,
	engine:       GameEngine,
	board:        GameBoard,
	clock:        GameClock,
	captures:     GameCaptures,
	nav:          GameNavigate,
	setup:        GameSetup,
	history:      GameHistory,
	state:        GameState,
	onMove?:      (uci: string) => Promise<void>,
	playerColor?: BoardColor,
	white?:       string,
	black?:       string,
};

export function newGameDeps(boardUI: HTMLElement): GameDeps {
	const cfg      = new GameConfig(boardUI);
	const engine   = new ChessjsEngine();
	const board    = new ChessgroundBoard(cfg, engine);
	const clock    = new GameClock(cfg.ui, engine);
	const captures = new GameCaptures(cfg.ui, engine);
	const nav      = new GameNavigate(cfg.ui, board, engine, captures);
	const setup    = new GameSetup();
	const history  = new GameHistory();
	const state    = new GameStateImpl(engine, clock, nav, setup, history);
	return {
		cfg:      cfg,
		engine:   engine,
		board:    board,
		clock:    clock,
		captures: captures,
		nav:      nav,
		setup:    setup,
		history:  history,
		state:    state,
	};
}
