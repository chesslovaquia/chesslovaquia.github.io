// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { w3ToggleMenu } from './utils';
import { w3HideMenu   } from './utils';
import { w3ShowModal  } from './utils';
import { w3HideModal  } from './utils';

import { logger } from './Logger';

import { ClvqLocalStorage } from './ClvqLocalStorage';

import { LichessAuth    } from '../lichess/LichessAuth';
import { LichessClient  } from '../lichess/LichessClient';
import { LichessStream  } from '../lichess/LichessStream';
import { LichessGame    } from '../lichess/LichessGame';
import { LichessUIBridge } from '../lichess/LichessUIBridge';

import { GameSetup } from '../game/GameSetup';

export type ClvqDeps = {
	lichessGame?: LichessGame;
};

export class Clvq {
	private readonly auth: LichessAuth;
	private readonly bridge: LichessUIBridge;
	private lichessGameInst: LichessGame | null;

	constructor(deps?: ClvqDeps) {
		logger.debug('Clvq loaded.');
		this.auth    = new LichessAuth(new ClvqLocalStorage());
		this.bridge  = new LichessUIBridge(this.auth);
		this.lichessGameInst = deps?.lichessGame ?? null;
		if (this.lichessGameInst) {
			this.bridge.setup(this.lichessGameInst);
		}
		this.auth.handleCallback()
			.then(() => { this.bridge.updateUI(); })
			.catch((err: unknown) => { logger.error('Lichess callback error:', err); });
		this.bridge.updateUI();
	}

	public w3ToggleMenu(id: string): void {
		w3ToggleMenu(id);
	}

	public w3HideMenu(id: string): void {
		w3HideMenu(id);
	}

	public w3HideModal(id: string): void {
		w3HideModal(id);
	}

	public w3ShowModal(id: string): void {
		w3ShowModal(id);
	}

	public lichessLogin(): void {
		this.auth.login().catch((err: unknown) => {
			logger.error('Lichess login error:', err);
		});
	}

	public lichessLogout(): void {
		this.auth.logout();
		this.bridge.updateUI();
	}

	public gameSetup(timeMinutes: number, incrementSeconds: number): void {
		const s = new GameSetup();
		s.newGame({
			time: timeMinutes * 60,
			increment: incrementSeconds,
			desc: `${timeMinutes}+${incrementSeconds}`,
		});
	}

	public gameSetupCorrespondence(days: number): void {
		let unit = 'days';
		if (days === 1) {
			unit = 'day';
		}
		const time = days * 86400;
		const s = new GameSetup();
		s.newGame({
			time: time,
			increment: 0,
			desc: `${days} ${unit}`,
			correspondence: true,
		});
	}

	// --- Lichess online play ---

	public lichessSeek(timeMinutes: number, incrementSeconds: number): void {
		const game = this.getLichessGame();
		game.seek({ time: timeMinutes, increment: incrementSeconds })
			.catch((err: unknown) => { logger.error('Lichess seek error:', err); });
	}

	public lichessAcceptChallenge(): void {
		if (!this.bridge.pendingChallengeId) return;
		this.bridge.acceptChallenge(this.getLichessGame());
	}

	public lichessDeclineChallenge(): void {
		if (!this.bridge.pendingChallengeId) return;
		this.bridge.declineChallenge(this.getLichessGame());
	}

	public lichessResign(): void {
		if (!this.bridge.activeGameId) return;
		this.bridge.resign(this.getLichessGame());
	}

	public lichessAbort(): void {
		if (!this.bridge.activeGameId) return;
		this.bridge.abort(this.getLichessGame());
	}

	public lichessOfferDraw(): void {
		if (!this.bridge.activeGameId) return;
		this.bridge.offerDraw(this.getLichessGame());
	}

	// --- Private helpers ---

	private getLichessGame(): LichessGame {
		if (!this.lichessGameInst) {
			const client = new LichessClient(this.auth);
			const stream = new LichessStream(client);
			this.lichessGameInst = new LichessGame(client, stream);
			this.bridge.setup(this.lichessGameInst);
			this.lichessGameInst.startEventStream();
		}
		return this.lichessGameInst;
	}
}
