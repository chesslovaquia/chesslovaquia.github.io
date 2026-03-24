// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { w3ToggleMenu } from './utils';
import { w3ShowModal  } from './utils';
import { w3HideModal  } from './utils';

import { ClvqLocalStorage } from './ClvqLocalStorage';
import { ElementIds       } from './ElementIds';

import { LichessAuth } from '../lichess/LichessAuth';

import { GameSetup } from '../game/GameSetup';

export class Clvq {
	private readonly auth: LichessAuth;

	constructor() {
		console.debug('Clvq loaded.');
		this.auth = new LichessAuth(new ClvqLocalStorage());
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
