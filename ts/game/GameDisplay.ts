// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { w3ShowModal } from '../clvq/utils';
import { ElementIds  } from '../clvq/ElementIds';

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';

import { GameConfig } from './GameConfig';
import { GameMove   } from './GameMove';

export class GameDisplay {
	private readonly cfg:    GameConfig;
	private readonly engine: GameEngine;
	private readonly move:   GameMove;

	constructor(cfg: GameConfig, engine: GameEngine, move: GameMove) {
		this.cfg = cfg;
		this.engine = engine;
		this.move = move;
	}

	private setStatus(status: string): void {
		if (status) {
			if (this.cfg.ui.status) {
				this.cfg.ui.status.textContent = status;
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
		if (this.cfg.ui.status) {
			this.cfg.ui.status.textContent = '';
		}
		if (this.cfg.ui.outcome) {
			this.cfg.ui.outcome.textContent = '';
		}
	}

	public clockTimeout(color: EngineColor): void {
		const winner = color === 'w' ? 'Black' : 'White';
		const text = `Timeout! ${winner} wins.`;
		this.clear();
		this.showOutcome(text);
		this.setStatus(text);
		this.cfg.ui.board.classList.toggle('timeout', true);
	}

	public async setDescription(desc: string): Promise<void> {
		if (this.cfg.ui.description) {
			this.cfg.ui.description.textContent = desc;
		}
	}

	public onlineGameOver(reason: string, winner?: string): void {
		let text: string;
		switch (reason) {
			case 'resign':
				text = winner ? `${winner === 'white' ? 'White' : 'Black'} wins by resignation.` : 'Resignation.';
				break;
			case 'outoftime':
				text = winner ? `${winner === 'white' ? 'White' : 'Black'} wins on time.` : 'Out of time.';
				break;
			case 'draw':
				text = 'Draw.';
				break;
			case 'aborted':
				text = 'Game aborted.';
				break;
			default:
				text = `Game over: ${reason}.`;
				break;
		}
		this.clear();
		this.showOutcome(text);
		this.setStatus(text);
	}

	public setOpponentInfo(playerNum: 1 | 2, name: string, rating?: number, title?: string): void {
		const nameEl   = document.getElementById(ElementIds.gamePlayer + String(playerNum));
		const ratingEl = document.getElementById(ElementIds.gamePlayerRating + String(playerNum));
		if (nameEl) {
			nameEl.textContent = title ? `${title} ${name}` : name;
		}
		if (ratingEl) {
			if (rating) {
				ratingEl.textContent  = `(${rating})`;
				ratingEl.style.display = '';
			} else {
				ratingEl.textContent  = '';
				ratingEl.style.display = 'none';
			}
		}
	}

	public showActionsBar(): void {
		const el = document.getElementById(ElementIds.gameActionsBar);
		if (el) el.style.display = '';
	}

	public hideActionsBar(): void {
		const el = document.getElementById(ElementIds.gameActionsBar);
		if (el) el.style.display = 'none';
	}

	private showOutcome(status: string) {
		if (this.cfg.ui.outcome) {
			this.cfg.ui.outcome.textContent = status;
			w3ShowModal(ElementIds.gameOutcomeModal);
		}
	}
}
