// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chessground           } from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';

import * as cg from 'chessground/types';

import { GameEngine } from '../engine/GameEngine';

import { GameConfig } from '../game/GameConfig';

import { EventBoardMove } from '../events/EventBoardMove';

import { BoardDests  } from './GameBoard';
import { BoardMove   } from './GameBoard';
import { BoardSquare } from './GameBoard';

export class ChessBoard {
	private readonly cfg:    GameConfig;
	private readonly engine: GameEngine;
	private readonly board:  ChessgroundApi;

	constructor(cfg: GameConfig, engine: GameEngine) {
		this.cfg    = cfg;
		this.engine = engine;
		this.board  = this.newBoard();
	}

	private newBoard(): ChessgroundApi {
		return Chessground(this.cfg.ui.board, {
			disableContextMenu: true,
			coordinates: false,
			fen: this.engine.fen(),
			orientation: 'white',
			turnColor: 'white',
			movable: {
				color: 'white',
				free: false,
				showDests: false,
				rookCastle: true,
				events: {
					after: (orig: cg.Key, dest: cg.Key, meta?: cg.MoveMetadata) => {
						this.afterMove(orig, dest, meta);
					},
				},
			},
			highlight: {
				lastMove: true,
				check: true,
			},
			selectable: {
				enabled: true,
			},
			premovable: {
				enabled: false,
			},
			animation: {
				enabled: false,
				duration: 200,
			},
			drawable: {
				enabled: false,
			},
			draggable: {
				enabled: false,
			},
		});
	}

	private afterMove(orig: cg.Key, dest: cg.Key, meta?: cg.MoveMetadata): void {
		this.disableMoves();
		console.debug('Board dispatch move event.');
		const data = {
			from: orig as BoardSquare,
			to: dest as BoardSquare,
		};
		const evt  = new EventBoardMove(data);
		EventBoardMove.Target.dispatchEvent(evt);
		this.enableMoves();
	}

	private turnColor(): cg.Color {
		return this.engine.turn() === 'w' ? 'white' : 'black';
	}

	private disableMoves(): void {
		console.debug('Board disable moves.');
		this.board.set({ movable: { color: undefined } });
	}

	private enableMoves(): void {
		console.debug('Board enable moves.');
		this.board.set({ movable: { color: this.turnColor() } });
	}

	private getLastMove(m: BoardMove | null): cg.Key[] {
		if (m) {
			return [m.from as cg.Key, m.to as cg.Key];
		}
		return [];
	}


	public disable(): void {
		console.debug('Board disable.');
		this.board.set({
			movable: {
				color: undefined,
			},
			selectable: {
				enabled: false,
			},
		});
	}

	public enable(): void {
		console.debug('Board enable.');
		this.board.set({
			movable: {
				color: this.turnColor(),
			},
			selectable: {
				enabled: true,
			},
		});
	}

	public init(): void {
		const turnColor = this.turnColor();
		this.board.set({
			turnColor: turnColor,
			movable: {
				color: turnColor,
				dests: this.engine.possibleDests(),
				showDests: true,
			},
		});
	}

	public update(): void {
		const turnColor = this.turnColor();
		this.board.set({
			fen: this.engine.fen(),
			turnColor: turnColor,
			movable: {
				color: turnColor,
				dests: this.engine.possibleDests()
			},
			lastMove: this.getLastMove(this.engine.lastMove()),
			check: this.engine.inCheck(),
		});
	}

	public reset(): void {
		this.board.set({fen: this.engine.fen()});
	}

	public getFen(): string {
		return this.board.getFen();
	}

	public setPosition(fen: string, lastMove: BoardMove): void {
		console.debug('Board set position:', fen, lastMove);
		this.board.set({fen: fen, lastMove: this.getLastMove(lastMove)});
	}
}
