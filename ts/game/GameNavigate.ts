// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine } from '../engine/GameEngine';

import { ConfigGameUI } from '../config/ConfigGameUI';

import { GameBoard } from '../board/GameBoard';
import { BoardMove } from '../board/GameBoard';

import * as utils from '../clvq/utils';

type BoardPositions = string[];

type NavState = {
	pos:   BoardPositions,
	index: number,
	moves: BoardMove[],
}

export class GameNavigate {
	private readonly ui:     ConfigGameUI;
	private readonly board:  GameBoard;
	private readonly engine: GameEngine;

	private pos:   BoardPositions;
	private index: number;
	private moves: BoardMove[];

	constructor(ui: ConfigGameUI, board: GameBoard, engine: GameEngine) {
		this.ui     = ui;
		this.board  = board;
		this.engine = engine;
		this.pos    = [];
		this.index  = -1;
		this.moves  = [];
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.ui.navBackward?.addEventListener('click', () => this.navBackward());
		this.ui.navForward?.addEventListener('click', () => this.navForward());
	}

	public addPosition(): void {
		const lastMove = this.engine.lastMove();
		if (lastMove) {
			this.moves.push(lastMove);
		}
		this.pos.push(this.board.getFen());
		this.index++;
		if (this.index === 1) {
			utils.enableButton(this.ui.navBackward);
		}
	}

	public navBackward(): void {
		console.debug('Game nav backward.');
		if (this.index === this.pos.length - 1) {
			utils.enableButton(this.ui.navForward);
			this.board.disable();
		}
		this.index--;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
		if (this.index === 0) {
			utils.disableButton(this.ui.navBackward);
		}
	}

	public navForward(): void {
		console.debug('Game nav forward.');
		this.index++;
		this.board.setPosition(this.pos[this.index], this.moves[this.index - 1]);
		if (this.index === this.pos.length - 1) {
			utils.disableButton(this.ui.navForward);
			this.board.enable();
		}
		if (this.index === 1) {
			utils.enableButton(this.ui.navBackward);
		}
	}

	public getState(): NavState {
		return {
			pos:   this.pos,
			index: this.index,
			moves: this.moves,
		};
	}

	public setState(state: NavState): void {
		if (state.pos) {
			this.pos   = state.pos;
			this.index = state.index;
			this.moves = state.moves;
			if (this.index >= 1) {
				utils.enableButton(this.ui.navBackward);
			}
		}
	}
}
