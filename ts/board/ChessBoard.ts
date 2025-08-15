// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chessground           } from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';

import * as cg from 'chessground/types';

import { Chess } from 'chess.js';

import { ChessGameConfig } from '../game/ChessGameConfig';
import { ChessGameError  } from '../game/ChessGameError';

import {
	BoardMoveEvent,
	BoardAfterMoveEvent,
} from './events';

class ChessBoard {
	private readonly cfg:   ChessGameConfig;
	private readonly game:  Chess;
	private readonly board: ChessgroundApi;

	constructor(cfg: ChessGameConfig, game: Chess) {
		this.cfg   = cfg;
		this.game  = game;
		this.board = this.newBoard();
	}

	private newBoard(): ChessgroundApi {
		if (!this.cfg.boardElement) {
			throw new ChessGameError('Init board element not found.');
		}
		return Chessground(this.cfg.boardElement, {
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
						const data = {orig: orig, dest: dest};
						const evt  = new BoardMoveEvent(data);
						document.dispatchEvent(evt);
						this.enableMoves();
					},
				},
			},
			events: {
				move: (orig: cg.Key, dest: cg.Key, gotPiece?: cg.Piece) => {
					this.disableMoves();
					const data = {orig: orig, dest: dest, gotPiece: gotPiece};
					const evt  = new BoardAfterMoveEvent(data);
					document.dispatchEvent(evt);
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
}

export { ChessBoard };
