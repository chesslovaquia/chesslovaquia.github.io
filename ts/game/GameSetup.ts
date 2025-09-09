// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqIndexedDB, Store } from '../clvq/ClvqIndexedDB';

import { screenLoad  } from './screen';
import { screenDelay } from './screen';

export type SetupData = {
	time:      number,
	increment: number,
	desc:      string,
}

export class GameSetup {
	private readonly id: string;
	private readonly db: ClvqIndexedDB;

	constructor() {
		this.id = 'setup';
		this.db = new ClvqIndexedDB(Store.state);
	}

	public async newGame(data: SetupData): Promise<void> {
		console.debug('Setup new game:', data);
		await this.db.setItem(this.id, data);
		screenLoad(screenDelay);
	}

	public async getGame(): Promise<SetupData> {
		console.debug('Setup get game.');
		return await this.db.getItem(this.id);
	}

	public async removeGame(): Promise<void> {
		console.debug('Setup remove game.');
		this.db.removeItem(this.id);
	}
}
