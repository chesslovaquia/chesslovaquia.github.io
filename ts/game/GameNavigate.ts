// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';

import { ConfigGameUI } from '../config/ConfigGameUI';

import { GameBoard           } from '../board/GameBoard';
import { BoardMove           } from '../board/GameBoard';
import { BoardPromotionPiece } from '../board/GameBoard';

import { GameCaptures  } from './GameCaptures';
import { CapturesState } from './GameCaptures';

import { logger } from '../clvq/Logger';
import * as utils from '../clvq/utils';

type BoardPositions = string[];

export type NavState = {
	pos: BoardPositions,
	index: number,
	moves: BoardMove[],
	captures: CapturesState,
}

export class GameNavigate {
	private readonly ui:       ConfigGameUI;
	private readonly board:    GameBoard;
	private readonly engine:   GameEngine;
	private readonly captures: GameCaptures;

	private pos:   BoardPositions;
	private index: number;
	private moves: BoardMove[];

	constructor(ui: ConfigGameUI, board: GameBoard, engine: GameEngine, captures: GameCaptures) {
		this.ui = ui;
		this.board = board;
		this.engine = engine;
		this.captures = captures;
		this.pos = [];
		this.index = -1;
		this.moves = [];
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.ui.navBackward?.addEventListener('click', () => this.navBackward());
		this.ui.navForward?.addEventListener('click', () => this.navForward());
		this.ui.navFirstMove?.addEventListener('click', () => this.navFirstMove());
		this.ui.navLastMove?.addEventListener('click', () => this.navLastMove());
	}

	private navBackward(): void {
		logger.debug('Game nav backward.');
		if (this.index <= 0) {
			return;
		}
		if (this.index === this.pos.length - 1) {
			utils.enableButton(this.ui.navForward);
			utils.enableButton(this.ui.navLastMove);
			this.board.disable();
		}
		this.index--;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
		this.captures.setPosition(this.index);
		if (this.index === 0) {
			utils.disableButton(this.ui.navBackward);
			utils.disableButton(this.ui.navFirstMove);
		}
	}

	private navFirstMove(): void {
		logger.debug('Game nav first move.');
		this.board.disable();
		this.index = 0;
		this.board.setPosition(this.pos[this.index], undefined);
		this.captures.setPosition(this.index);
		utils.disableButton(this.ui.navBackward);
		utils.disableButton(this.ui.navFirstMove);
		utils.enableButton(this.ui.navForward);
		utils.enableButton(this.ui.navLastMove);
	}

	private navForward(): void {
		logger.debug('Game nav forward.');
		this.index++;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
		this.captures.setPosition(this.index);
		if (this.index === this.pos.length - 1) {
			utils.disableButton(this.ui.navForward);
			utils.disableButton(this.ui.navLastMove);
			this.board.enable();
		}
		if (this.index === 1) {
			utils.enableButton(this.ui.navBackward);
			utils.enableButton(this.ui.navFirstMove);
		}
	}

	private navLastMove(): void {
		logger.debug('Game nav last move.');
		this.index = this.pos.length - 1;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
		this.captures.setPosition(this.index);
		utils.enableButton(this.ui.navBackward);
		utils.enableButton(this.ui.navFirstMove);
		utils.disableButton(this.ui.navForward);
		utils.disableButton(this.ui.navLastMove);
		this.board.enable();
	}

	public addPosition(): void {
		logger.debug('Game nav add position.');
		const lastMove = this.engine.lastMove();
		if (lastMove) {
			this.moves.push(lastMove);
		}
		this.pos.push(this.engine.fen());
		this.index++;
		if (this.index === 1) {
			utils.enableButton(this.ui.navBackward);
			utils.enableButton(this.ui.navFirstMove);
		}
		this.captures.addPosition();
	}

	public getState(): NavState {
		return {
			pos: this.pos,
			index: this.index,
			moves: this.moves,
			captures: this.captures.getState(),
		};
	}

	public addPromotion(side: EngineColor, piece: BoardPromotionPiece): void {
		logger.debug('Game nav add promotion:', side, piece);
		this.captures.addPromotion(side, piece);
		this.addPosition();
	}

	public flip(): void {
		this.captures.flip();
	}
}
