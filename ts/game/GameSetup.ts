// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { logger } from '../clvq/Logger';

import { ClvqIndexedDB, Store } from '../clvq/ClvqIndexedDB';

export type SetupData = {
	time:            number,
	increment:       number,
	desc:            string,
	correspondence?: boolean,
}

export class GameSetup {
	private readonly id: string;
	private readonly db: ClvqIndexedDB<SetupData>;

	private data: SetupData | undefined;

	constructor() {
		this.id = 'setup';
		this.db = new ClvqIndexedDB<SetupData>(Store.state);
		this.data = undefined;
	}

	public async newGame(data: SetupData): Promise<void> {
		logger.debug('Setup new game:', data);
		this.data = data;
		await this.db.setItem(this.id, this.data);
		window.location.assign('/play/');
	}

	public async getGame(): Promise<SetupData> {
		logger.debug('Setup get game.');
		this.data = await this.db.getItem(this.id) ?? undefined;
		return this.data as SetupData;
	}

	public async removeGame(): Promise<void> {
		logger.debug('Setup remove game.');
		this.data = undefined;
		await this.db.removeItem(this.id);
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

	public setState(data: SetupData) {
		logger.debug('Setup set state:', data);
		this.data = data;
	}
}
