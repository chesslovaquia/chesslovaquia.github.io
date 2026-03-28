// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { logger } from '../clvq/Logger';

export type SetupData = {
	time:            number,
	increment:       number,
	desc:            string,
	correspondence?: boolean,
}

const storageKey = 'clvq.setup';

export class GameSetup {

	private data: SetupData | undefined;

	constructor() {
		this.data = undefined;
	}

	public newGame(data: SetupData): void {
		logger.debug('Setup new game:', data);
		this.data = data;
		sessionStorage.setItem(storageKey, JSON.stringify(this.data));
		window.location.assign('/play/');
	}

	public getGame(): SetupData | undefined {
		logger.debug('Setup get game.');
		const raw = sessionStorage.getItem(storageKey);
		this.data = raw ? JSON.parse(raw) as SetupData : undefined;
		return this.data;
	}

	public removeGame(): void {
		logger.debug('Setup remove game.');
		this.data = undefined;
		sessionStorage.removeItem(storageKey);
	}

	public description(): string {
		if (this.data) {
			return this.data.desc;
		}
		return 'NOGAME';
	}

	public timeControlDesc(): string {
		if (this.data) {
			return `${this.data.time}+${this.data.increment}`;
		}
		return '-';
	}
}
