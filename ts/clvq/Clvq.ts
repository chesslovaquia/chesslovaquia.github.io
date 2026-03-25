// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { w3ToggleMenu } from './utils';
import { w3ShowModal  } from './utils';
import { w3HideModal  } from './utils';

import { ClvqLocalStorage } from './ClvqLocalStorage';
import { ElementIds       } from './ElementIds';

import { LichessAuth    } from '../lichess/LichessAuth';
import { LichessClient  } from '../lichess/LichessClient';
import { LichessStream  } from '../lichess/LichessStream';
import { LichessGame    } from '../lichess/LichessGame';
import { LichessHistory } from '../lichess/LichessHistory';
import type { LichessChallenge, LichessGameFull } from '../lichess/LichessGame';

import { GameHistory  } from '../game/GameHistory';
import type { HistoryRecord } from '../game/GameHistory';

import { GameSetup } from '../game/GameSetup';

export type ClvqDeps = {
	lichessGame?: LichessGame;
};

export class Clvq {
	private readonly auth: LichessAuth;
	private lichessGameInst: LichessGame | null;
	private pendingChallengeId: string | null = null;
	private activeGameId: string | null = null;
	private historyRecords: HistoryRecord[] = [];

	constructor(deps?: ClvqDeps) {
		console.debug('Clvq loaded.');
		this.auth = new LichessAuth(new ClvqLocalStorage());
		this.lichessGameInst = deps?.lichessGame ?? null;
		if (this.lichessGameInst) {
			this.setupLichessCallbacks(this.lichessGameInst);
		}
		this.auth.handleCallback()
			.then(() => { this.updateLichessUI(); })
			.catch((err: unknown) => { console.error('Lichess callback error:', err); });
		this.updateLichessUI();
	}

	public w3ToggleMenu(id: string): void {
		w3ToggleMenu(id);
	}

	public w3HideModal(id: string): void {
		w3HideModal(id);
	}

	public w3ShowModal(id: string): void {
		w3ShowModal(id);
	}

	public lichessLogin(): void {
		this.auth.login().catch((err: unknown) => {
			console.error('Lichess login error:', err);
		});
	}

	public lichessLogout(): void {
		this.auth.logout();
		this.updateLichessUI();
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
			.catch((err: unknown) => { console.error('Lichess seek error:', err); });
	}

	public lichessAcceptChallenge(): void {
		if (!this.pendingChallengeId) return;
		const id = this.pendingChallengeId;
		this.pendingChallengeId = null;
		w3HideModal(ElementIds.lichessChallengeModal);
		this.getLichessGame().acceptChallenge(id)
			.catch((err: unknown) => { console.error('Lichess accept challenge error:', err); });
	}

	public lichessDeclineChallenge(): void {
		if (!this.pendingChallengeId) return;
		const id = this.pendingChallengeId;
		this.pendingChallengeId = null;
		w3HideModal(ElementIds.lichessChallengeModal);
		this.getLichessGame().declineChallenge(id)
			.catch((err: unknown) => { console.error('Lichess decline challenge error:', err); });
	}

	public lichessResign(): void {
		if (!this.activeGameId) return;
		this.getLichessGame().resign(this.activeGameId)
			.catch((err: unknown) => { console.error('Lichess resign error:', err); });
	}

	public lichessAbort(): void {
		if (!this.activeGameId) return;
		this.getLichessGame().abort(this.activeGameId)
			.catch((err: unknown) => { console.error('Lichess abort error:', err); });
	}

	public lichessOfferDraw(): void {
		if (!this.activeGameId) return;
		this.getLichessGame().offerOrAcceptDraw(this.activeGameId)
			.catch((err: unknown) => { console.error('Lichess offer draw error:', err); });
	}

	// --- Game history ---

	public loadHistory(): void {
		const history = new GameHistory();
		history.list()
			.then((records) => {
				this.historyRecords = records;
				this.renderHistoryList(records);
				w3ShowModal(ElementIds.gameHistoryModal);
			})
			.catch((err: unknown) => { console.error('Load history error:', err); });
	}

	public loadLichessHistory(): void {
		if (!this.auth.isLoggedIn()) return;
		const client = new LichessClient(this.auth);
		const hist   = new LichessHistory(this.auth, client);
		hist.fetchGames()
			.then((records) => {
				this.historyRecords = [...records, ...this.historyRecords];
				const history = new GameHistory();
				return history.list().then((all) => {
					this.historyRecords = all;
					this.renderHistoryList(all);
				});
			})
			.catch((err: unknown) => { console.error('Lichess history error:', err); });
	}

	public exportPgn(index: number): void {
		const record = this.historyRecords[index];
		if (!record) return;
		const blob = new Blob([record.pgn], { type: 'application/x-chess-pgn' });
		const url  = URL.createObjectURL(blob);
		const a    = document.createElement('a');
		a.href     = url;
		a.download = `${record.white}-vs-${record.black}-${record.date.slice(0, 10)}.pgn`;
		a.click();
		URL.revokeObjectURL(url);
	}

	private renderHistoryList(records: HistoryRecord[]): void {
		const listEl = document.getElementById(ElementIds.gameHistoryList);
		if (!listEl) return;
		if (records.length === 0) {
			listEl.innerHTML = '<p class="w3-text-grey">No games yet.</p>';
			return;
		}
		const rows = records.map((r, i) => {
			const dateStr = r.date.slice(0, 10);
			const src     = r.source === 'lichess' ? ' [lichess]' : '';
			return `<div class="w3-bar w3-border-bottom w3-small" style="padding:4px 0">` +
				`<span class="w3-bar-item">${dateStr}${src}</span>` +
				`<span class="w3-bar-item w3-bold">${r.white} vs ${r.black}</span>` +
				`<span class="w3-bar-item">${r.result}</span>` +
				`<span class="w3-bar-item w3-text-grey">${r.timeControl}</span>` +
				`<button class="w3-bar-item w3-button w3-small w3-right" ` +
				`onclick="Clvq.exportPgn(${i})">PGN</button>` +
				`</div>`;
		});
		listEl.innerHTML = rows.join('');
	}

	// --- Private helpers ---

	private getLichessGame(): LichessGame {
		if (!this.lichessGameInst) {
			const client = new LichessClient(this.auth);
			const stream = new LichessStream(client);
			this.lichessGameInst = new LichessGame(client, stream);
			this.setupLichessCallbacks(this.lichessGameInst);
			this.lichessGameInst.startEventStream();
		}
		return this.lichessGameInst;
	}

	private setupLichessCallbacks(game: LichessGame): void {
		game.onChallenge((challenge: LichessChallenge) => {
			this.pendingChallengeId = challenge.id;
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
			this.activeGameId = gameId;
			const bar = document.getElementById(ElementIds.gameActionsBar);
			if (bar) bar.style.display = '';
		});

		game.onGameFinish((_gameId: string) => {
			this.activeGameId = null;
			const bar = document.getElementById(ElementIds.gameActionsBar);
			if (bar) bar.style.display = 'none';
		});

		game.onGameFull((gameFull: LichessGameFull) => {
			this.setPlayerRatingUI('1', gameFull.white.username, gameFull.white.rating);
			this.setPlayerRatingUI('2', gameFull.black.username, gameFull.black.rating);
		});
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

	private updateLichessUI(): void {
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
				userEl.textContent  = user.rating ? `${label} (${user.rating})` : label;
				userEl.style.display = '';
			}
		} else {
			loginEl.style.display  = '';
			logoutEl.style.display = 'none';
			userEl.style.display   = 'none';
			userEl.textContent     = '';
		}
	}
}
