// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { w3ShowModal } from '../clvq/utils';
import { w3HideModal } from '../clvq/utils';

import { ElementIds } from '../clvq/ElementIds';

import { logger } from '../clvq/Logger';

import { LichessAuth } from './LichessAuth';
import { LichessGame } from './LichessGame';
import type { LichessChallenge, LichessGameFull } from './LichessGame';

export class LichessUIBridge {
	private readonly auth: LichessAuth;
	private _pendingChallengeId: string | null = null;
	private _activeGameId: string | null = null;

	constructor(auth: LichessAuth) {
		this.auth = auth;
	}

	get pendingChallengeId(): string | null {
		return this._pendingChallengeId;
	}

	get activeGameId(): string | null {
		return this._activeGameId;
	}

	public setup(game: LichessGame): void {
		game.onChallenge((challenge: LichessChallenge) => {
			this._pendingChallengeId = challenge.id;
			const nameEl   = document.getElementById(ElementIds.lichessChallengerName);
			const ratingEl = document.getElementById(ElementIds.lichessChallengerRating);
			const timeEl   = document.getElementById(ElementIds.lichessChallengeTimeCtrl);
			if (nameEl) {
				nameEl.textContent = challenge.challenger.username;
			}
			if (ratingEl) {
				ratingEl.textContent = challenge.challenger.rating
					? `(${challenge.challenger.rating})`
					: '';
			}
			if (timeEl) {
				const tc = challenge.timeControl;
				if (tc.limit !== undefined && tc.increment !== undefined) {
					timeEl.textContent = `${Math.floor(tc.limit / 60)}+${tc.increment}`;
				} else {
					timeEl.textContent = tc.type;
				}
			}
			w3ShowModal(ElementIds.lichessChallengeModal);
		});

		game.onGameStart((gameId: string) => {
			this._activeGameId = gameId;
			const bar = document.getElementById(ElementIds.gameActionsBar);
			if (bar) bar.style.display = '';
		});

		game.onGameFinish((_gameId: string) => {
			this._activeGameId = null;
			const bar = document.getElementById(ElementIds.gameActionsBar);
			if (bar) bar.style.display = 'none';
		});

		game.onGameFull((gameFull: LichessGameFull) => {
			this.setPlayerRatingUI('1', gameFull.white.username, gameFull.white.rating);
			this.setPlayerRatingUI('2', gameFull.black.username, gameFull.black.rating);
		});
	}

	public updateUI(): void {
		const loginEl  = document.getElementById(ElementIds.lichessLogin);
		const logoutEl = document.getElementById(ElementIds.lichessLogout);
		const userEl   = document.getElementById(ElementIds.lichessUser);

		if (!loginEl || !logoutEl || !userEl) return;

		if (this.auth.isLoggedIn()) {
			const user = this.auth.getUser();
			loginEl.style.display  = 'none';
			logoutEl.style.display = '';
			if (user) {
				const label = user.title
					? `${user.title} ${user.username}`
					: user.username;
				userEl.textContent   = user.rating ? `${label} (${user.rating})` : label;
				userEl.style.display = '';
			}
		} else {
			loginEl.style.display  = '';
			logoutEl.style.display = 'none';
			userEl.style.display   = 'none';
			userEl.textContent     = '';
		}
	}

	public acceptChallenge(game: LichessGame): void {
		const id = this._pendingChallengeId!;
		this._pendingChallengeId = null;
		w3HideModal(ElementIds.lichessChallengeModal);
		game.acceptChallenge(id)
			.catch((err: unknown) => { logger.error('Lichess accept challenge error:', err); });
	}

	public declineChallenge(game: LichessGame): void {
		const id = this._pendingChallengeId!;
		this._pendingChallengeId = null;
		w3HideModal(ElementIds.lichessChallengeModal);
		game.declineChallenge(id)
			.catch((err: unknown) => { logger.error('Lichess decline challenge error:', err); });
	}

	public resign(game: LichessGame): void {
		game.resign(this._activeGameId!)
			.catch((err: unknown) => { logger.error('Lichess resign error:', err); });
	}

	public abort(game: LichessGame): void {
		game.abort(this._activeGameId!)
			.catch((err: unknown) => { logger.error('Lichess abort error:', err); });
	}

	public offerDraw(game: LichessGame): void {
		game.offerOrAcceptDraw(this._activeGameId!)
			.catch((err: unknown) => { logger.error('Lichess offer draw error:', err); });
	}

	private setPlayerRatingUI(num: '1' | '2', name: string, rating?: number): void {
		const nameEl   = document.getElementById(ElementIds.gamePlayer + num);
		const ratingEl = document.getElementById(ElementIds.gamePlayerRating + num);
		if (nameEl) {
			nameEl.textContent = name;
		}
		if (ratingEl) {
			if (rating) {
				ratingEl.textContent   = `(${rating})`;
				ratingEl.style.display = '';
			} else {
				ratingEl.style.display = 'none';
			}
		}
	}
}
