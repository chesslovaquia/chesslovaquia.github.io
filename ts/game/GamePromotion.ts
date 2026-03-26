// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { BoardPromotionPiece } from '../board/GameBoard';
import { BoardColor          } from '../board/GameBoard';

import { EngineMove } from '../engine/GameEngine';

import { toEngine } from '../engine/ColorUtils';

import { GameDisplay  } from './GameDisplay';
import { GameMove     } from './GameMove';
import { GameState    } from './GameState';
import { GameNavigate } from './GameNavigate';

import { ElementIds } from '../clvq/ElementIds';

export class GamePromotion {
	private readonly state:   GameState;
	private readonly move:    GameMove;
	private readonly display: GameDisplay;
	private readonly nav:     GameNavigate;

	constructor(s: GameState, m: GameMove, d: GameDisplay, n: GameNavigate) {
		this.state = s;
		this.move = m;
		this.display = d;
		this.nav = n;
	}

	public handle(move: EngineMove): void {
		console.log('Pawn promotion handle:', move);
		this.move.undo();
		const side: BoardColor = this.move.turnColor();
		this.showModal(side, (selectedPiece) => {
			this.exec(move, side, selectedPiece);
		})
	}

	private exec(move: EngineMove, side: BoardColor, piece: BoardPromotionPiece): void {
		console.log('Pawn promotion exec:', move, side, piece);
		this.move.exec(move.from, move.to, piece);
		this.finish(move, side, piece);
	}

	private static readonly validPromotionPieces: BoardPromotionPiece[] = ['q', 'r', 'b', 'n'];

	private showModal(side: BoardColor, callback: (piece: BoardPromotionPiece) => void): void {
		console.log('Pawn promotion show modal:', side);
		const modal = document.getElementById(`${side}${ElementIds.pawnPromotion}`);
		if (modal) {
			modal.style.display = 'block';
			const handler = (evt: MouseEvent) => {
				console.log('Pawn promotion select:', evt.target);
				if (evt.target) {
					const elem = (evt.target as HTMLElement);
					if (elem.classList.contains('clvq-promotion-piece')) {
						const piece = elem.dataset.piece;
						if (!piece || !GamePromotion.validPromotionPieces.includes(piece as BoardPromotionPiece)) {
							console.error('Pawn promotion invalid piece:', piece);
							return;
						}
						modal.removeEventListener('click', handler);
						callback(piece as BoardPromotionPiece);
						modal.style.display = 'none';
					}
				}
			};
			modal.addEventListener('click', handler);
		} else {
			console.log('Pawn promotion ERROR:', side, 'modal not found.');
		}
	}

	private finish(move: EngineMove, side: BoardColor, piece: BoardPromotionPiece): void {
		console.log('Pawn promotion done:', move, side, piece);
		this.display.updateStatus();
		this.nav.addPromotion(toEngine(side), piece);
		this.saveState();
	}

	private saveState(): void {
		this.state.save();
		console.debug('Pawn promotion state saved.');
	}
}
