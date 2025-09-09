// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';

import { GameConfig } from './GameConfig';
import { GameMove   } from './GameMove';

export class GameDisplay {
	private readonly cfg:    GameConfig;
	private readonly engine: GameEngine;
	private readonly move:   GameMove;

	private description: string;

	constructor(cfg: GameConfig, engine: GameEngine, move: GameMove) {
		this.cfg = cfg;
		this.engine = engine;
		this.move = move;
		this.description = 'UNSET';
	}

	private setStatus(status: string): void {
		if (this.cfg.ui.statusBar) {
			if (status) {
				this.cfg.ui.statusBar.textContent = `${this.description} ${status}`;
			} else {
				this.cfg.ui.statusBar.textContent = this.description;
			}
		}
	}

	public async updateStatus(): Promise<void> {
		if (!this.cfg.ui.statusBar) {
			console.debug('Game status bar not found.');
			return;
		}
		let statusText = '';
		if (this.engine.isGameOver()) {
			if (this.engine.isCheckmate()) {
				const winner = this.engine.turn() === 'w' ? 'Black' : 'White';
				statusText = `Checkmate! ${winner} wins.`;
			} else if (this.engine.isDraw()) {
				statusText = 'Draw!';
			} else if (this.engine.isStalemate()) {
				statusText = 'Stalemate!';
			} else if (this.engine.isThreefoldRepetition()) {
				statusText = 'Draw by threefold repetition!';
			} else if (this.engine.isInsufficientMaterial()) {
				statusText = 'Draw by insufficient material!';
			}
		}
		this.setStatus(statusText);
	}

	public clear(): void {
		if (this.cfg.ui.statusBar) {
			this.cfg.ui.statusBar.textContent = '';
		}
	}

	public clockTimeout(color: EngineColor): void {
		if (this.cfg.ui.statusBar) {
			const winner = color === 'w' ? 'Black' : 'White';
			const text = `Timeout! ${winner} wins.`;
			this.setStatus(text);
		}
		this.cfg.ui.board.classList.toggle('timeout', true);
	}

	public async setDescription(desc: string): Promise<void> {
		this.description = desc;
		this.setStatus('');
	}
}
