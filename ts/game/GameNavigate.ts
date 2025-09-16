// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine } from '../engine/GameEngine';

import { ConfigGameUI } from '../config/ConfigGameUI';

import { GameBoard } from '../board/GameBoard';
import { BoardMove } from '../board/GameBoard';

import { GameCaptures  } from './GameCaptures';
import { CapturesState } from './GameCaptures';

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

	constructor(ui: ConfigGameUI, board: GameBoard, engine: GameEngine) {
		this.ui = ui;
		this.board = board;
		this.engine = engine;
		this.captures = new GameCaptures(this.ui, this.engine);
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
		console.debug('Game nav backward.');
		if (this.index === this.pos.length - 1) {
			utils.enableButton(this.ui.navForward);
			utils.enableButton(this.ui.navLastMove);
			this.board.disable();
		}
		this.index--;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
		if (this.index === 0) {
			utils.disableButton(this.ui.navBackward);
			utils.disableButton(this.ui.navFirstMove);
		}
	}

	private navFirstMove(): void {
		console.debug('Game nav first move.');
		this.board.disable();
		this.index = 0;
		this.board.setPosition(this.pos[this.index], undefined);
		utils.disableButton(this.ui.navBackward);
		utils.disableButton(this.ui.navFirstMove);
		utils.enableButton(this.ui.navForward);
		utils.enableButton(this.ui.navLastMove);
	}

	private navForward(): void {
		console.debug('Game nav forward.');
		this.index++;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
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
		console.debug('Game nav last move.');
		this.index = this.pos.length - 1;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
		utils.enableButton(this.ui.navBackward);
		utils.enableButton(this.ui.navFirstMove);
		utils.disableButton(this.ui.navForward);
		utils.disableButton(this.ui.navLastMove);
		this.board.enable();
	}

	public addPosition(): void {
		console.debug('Game nav add position.');
		const lastMove = this.engine.lastMove();
		if (lastMove) {
			this.moves.push(lastMove);
		}
		this.pos.push(this.board.getFen());
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

	public setState(state: NavState): void {
		if (state.pos) {
			this.pos   = state.pos;
			this.index = state.index;
			this.moves = state.moves;
			if (this.index >= 1) {
				utils.enableButton(this.ui.navBackward);
				utils.enableButton(this.ui.navFirstMove);
			}
			this.captures.setState(state.captures);
		}
	}
}
