// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chessground           } from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';

import * as cg from 'chessground/types';

import { Chess } from 'chess.js';

import * as chess from 'chess.js';

import { GameConfig } from '../game/GameConfig';

import { EventBoardMove } from '../events/EventBoardMove';

export class ChessBoard {
	private readonly cfg:   GameConfig;
	private readonly game:  Chess;
	private readonly board: ChessgroundApi;

	constructor(cfg: GameConfig, game: Chess) {
		this.cfg   = cfg;
		this.game  = game;
		this.board = this.newBoard();
	}

	private newBoard(): ChessgroundApi {
		return Chessground(this.cfg.ui.board, {
			disableContextMenu: true,
			coordinates: false,
			fen: this.game.fen(),
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
		const data = {orig: orig, dest: dest, meta: meta};
		const evt  = new EventBoardMove(data);
		EventBoardMove.Target.dispatchEvent(evt);
		this.enableMoves();
	}

	private turnColor(): cg.Color {
		return this.game.turn() === 'w' ? 'white' : 'black';
	}

	private disableMoves(): void {
		console.debug('Board disable moves.');
		this.board.set({ movable: { color: undefined } });
	}

	private enableMoves(): void {
		console.debug('Board enable moves.');
		this.board.set({ movable: { color: this.turnColor() } });
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

	private possibleDests(): Map<cg.Key, cg.Key[]> {
		const dests = new Map<cg.Key, cg.Key[]>();
		chess.SQUARES.forEach((square: chess.Square) => {
			const moves = this.game.moves({ square, verbose: true }) as chess.Move[];
			if (moves.length > 0) {
				dests.set(square as cg.Key, moves.map((move: chess.Move) => move.to as cg.Key));
			}
		})
		return dests;
	}

	public init(): void {
		this.board.set({
			turnColor: this.turnColor(),
			movable: {
				color: this.turnColor(),
				dests: this.possibleDests(),
				showDests: true,
			},
		});
	}

	private getMove(m: chess.Move | undefined): cg.Key[] {
		if (m) {
			return [m.from as cg.Key, m.to as cg.Key];
		}
		return [];
	}

	public update(lastMove: chess.Move | undefined): void {
		const turnColor = this.turnColor();
		this.board.set({
			fen: this.game.fen(),
			turnColor: turnColor,
			movable: {
				color: turnColor,
				dests: this.possibleDests()
			},
			lastMove: this.getMove(lastMove),
			check: this.game.inCheck(),
		});
	}

	public reset(): void {
		this.board.set({fen: this.game.fen()});
	}
}
