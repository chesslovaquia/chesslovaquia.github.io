// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { w3ShowModal } from '../clvq/utils';

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';

import { GameConfig } from './GameConfig';
import { GameMove   } from './GameMove';

export class GameDisplay {
	private readonly cfg:    GameConfig;
	private readonly engine: GameEngine;
	private readonly move:   GameMove;

	private description: string;
	private firstMove:   boolean;

	constructor(cfg: GameConfig, engine: GameEngine, move: GameMove) {
		this.cfg = cfg;
		this.engine = engine;
		this.move = move;
		this.description = 'UNSET';
		this.firstMove = true;
	}

	private setStatus(status: string): void {
		if (this.cfg.ui.statusBar) {
			if (status) {
				this.cfg.ui.statusBar.textContent = `${this.description} - ${status}`;
			} else {
				if (this.cfg.ui.messages) {
					if (this.firstMove) {
						this.cfg.ui.messages.textContent = '30 seconds for the first move.';
					} else {
						this.cfg.ui.messages.textContent = '';
					}
				}
			}
		}
	}

	public async updateStatus(): Promise<void> {
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
			this.clear();
			this.showOutcome(statusText);
		}
		this.setStatus(statusText);
	}

	public clear(): void {
		if (this.cfg.ui.statusBar) {
			this.cfg.ui.statusBar.textContent = '';
		}
		if (this.cfg.ui.messages) {
			this.cfg.ui.messages.textContent = '';
		}
		if (this.cfg.ui.outcome) {
			this.cfg.ui.outcome.textContent = '';
		}
	}

	public clockTimeout(color: EngineColor): void {
		if (this.cfg.ui.statusBar) {
			const winner = color === 'w' ? 'Black' : 'White';
			const text = `Timeout! ${winner} wins.`;
			this.clear();
			this.showOutcome(text);
			this.setStatus(text);
		}
		this.cfg.ui.board.classList.toggle('timeout', true);
	}

	public async setDescription(desc: string): Promise<void> {
		this.description = desc;
		if (this.cfg.ui.statusBar) {
			this.cfg.ui.statusBar.textContent = this.description;
		}
	}

	public disableFirstMove(): void {
		this.firstMove = false;
	}

	private showOutcome(status: string) {
		if (this.cfg.ui.outcome) {
			this.cfg.ui.outcome.textContent = status;
			w3ShowModal('gameOutcomeModal');
		}
	}
}
