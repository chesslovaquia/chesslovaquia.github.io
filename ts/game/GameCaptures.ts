// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';

import { BySide } from '../engine/ColorUtils';

import { BoardPiece          } from '../board/GameBoard';
import { BoardPromotionPiece } from '../board/GameBoard';

import { ConfigGameUI     } from '../config/ConfigGameUI';
import { ConfigGamePlayer } from '../config/ConfigGamePlayer';

import { logger } from '../clvq/Logger';

type CapturedPiece = BoardPiece | '';

const pieceValue: Record<BoardPiece, number> = {
	'p': 1,
	'b': 3,
	'n': 3,
	'r': 5,
	'q': 9,
	'k': 0,
};

const pieceSymbol: Record<BoardPiece, string> = {
	'p': 'fa-chess-pawn',
	'b': 'fa-chess-bishop',
	'n': 'fa-chess-knight',
	'r': 'fa-chess-rook',
	'q': 'fa-chess-queen',
	'k': 'fa-chess-king',
}

export type CapturesState = {
	captures: BySide<CapturedPiece[]>,
	count: BySide<number[]>,
}

export class GameCaptures {
	private readonly engine: GameEngine;
	private readonly p1: ConfigGamePlayer;
	private readonly p2: ConfigGamePlayer;

	private side: BySide<ConfigGamePlayer>;
	private captures: BySide<CapturedPiece[]>;
	private count: BySide<number[]>;
	private promotion: BySide<number>;
	private orientation: EngineColor;
	private index: number;

	constructor(ui: ConfigGameUI, engine: GameEngine) {
		this.engine = engine;
		this.p1 = ui.player1;
		this.p2 = ui.player2;
		this.side = {'w': this.p1, 'b': this.p2};
		this.captures = {'w': [], 'b': []};
		this.count = {'w': [], 'b': []};
		this.promotion = {'w': 0, 'b': 0};
		this.orientation = 'w';
		this.index = -1;
	}

	private getIndex(): number {
		return this.index;
	}

	public addPosition(): void {
		logger.debug('Game captures add position.');
		this.index++;
		const turn = this.engine.turn();
		const side = turn === 'w' ? 'b' : 'w';
		this.captures[turn].push('');
		const capture = this.engine.capturedPiece();
		if (capture) {
			logger.debug('Game capture:', side, capture);
			this.captures[side].push(capture);
			this.addCount(turn, side, capture);
			this.updateMaterial(side, capture);
			this.updateCount(this.getIndex());
		} else {
			this.captures[side].push('');
			this.addCount(turn, side, '');
		}
	}

	private addCount(turn: EngineColor, side: EngineColor, capture: CapturedPiece): void {
		// Opponent.
		const turnCount = this.count[turn];
		let current = (turnCount.length > 0 ? turnCount[turnCount.length - 1] : undefined) || 0;
		this.count[turn].push(current);
		// Side.
		const sideCount = this.count[side];
		current = (sideCount.length > 0 ? sideCount[sideCount.length - 1] : undefined) || 0;
		if (this.promotion[side] > 0) {
			current += this.promotion[side];
			this.promotion[side] = 0;
		}
		if (capture) {
			const value = pieceValue[capture];
			this.count[side].push(current + value);
		} else {
			this.count[side].push(current);
		}
	}

	private clearAllMaterial(): void {
		this.side['w'].material!.replaceChildren();
		this.side['b'].material!.replaceChildren();
	}

	private getPieceElement(side: EngineColor, piece: BoardPiece): HTMLElement {
		let color = 'game-material-white';
		if (side === 'w') {
			color = 'game-material-black';
		}
		const elem = document.createElement('i');
		elem.classList.add('fas', pieceSymbol[piece], color);
		return elem;
	}

	private updateMaterial(side: EngineColor, piece: BoardPiece): void {
		const elem = this.getPieceElement(side, piece);
		this.side[side].material!.appendChild(elem);
	}

	public getState(): CapturesState {
		return {
			captures: this.captures,
			count: this.count,
		}
	}

	public setState(state: CapturesState): void {
		this.captures = state.captures;
		this.count = state.count;
		this.clearAllMaterial();
		const idx = this.captures['w'].length - 1;
		this.setPosition(idx);
	}

	public setPosition(idx: number): void {
		this.index = idx;
		this.clearAllMaterial();
		this.clearAllCount();
		if (idx <= 0) {
			return;
		}
		this.setSidePosition(idx, 'w');
		this.setSidePosition(idx, 'b');
		this.updateCount(idx);
	}

	private setSidePosition(idx: number, side: EngineColor): void {
		for (let i = 0; i <= idx; i++) {
			const piece = this.captures[side][i];
			if (piece) {
				this.updateMaterial(side, piece);
			}
		}
	}

	private clearAllCount(): void {
		this.side['w'].materialCount!.textContent = '';
		this.side['b'].materialCount!.textContent = '';
	}

	private updateCount(idx: number): void {
		this.clearAllCount();
		const wCount = this.count['w'][idx] || 0;
		const bCount = this.count['b'][idx] || 0;
		let diff = wCount - bCount;
		if (diff === 0) {
			return;
		} else if (diff < 0) {
			// Black is up material.
			diff = diff * -1; // Remove - sign.
			this.side['b'].materialCount!.textContent = `+${diff}`;
		} else {
			// White is up material.
			this.side['w'].materialCount!.textContent = `+${diff}`;
		}
	}

	public addPromotion(side: EngineColor, piece: BoardPromotionPiece): void {
		logger.debug('Captures add promotion:', side, piece);
		this.promotion[side] = pieceValue[piece] - pieceValue['p'];
	}

	public flip(): void {
		this.clearAllMaterial();
		if (this.orientation === 'w') {
			this.side = {'w': this.p2, 'b': this.p1};
			this.orientation = 'b';
		} else {
			this.side = {'w': this.p1, 'b': this.p2};
			this.orientation = 'w';
		}
		this.setPosition(this.getIndex());
	}

}
