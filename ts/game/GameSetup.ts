// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { screenRedirect } from './screen';

import { GameData } from './types';

import { ClvqIndexedDB, Store } from '../clvq/ClvqIndexedDB';

type SetupData = {
	time:      number,
	increment: number,
}

export class GameSetup {
	private readonly db: ClvqIndexedDB;

	constructor() {
		this.db = new ClvqIndexedDB(Store.state);
	}

	public async newGame(data: SetupData): Promise<void> {
		console.debug('Setup new game:', data);
		await this.db.setItem('new', data);
		screenRedirect();
	}

	public async getGame(): Promise<GameData> {
		console.debug('Setup get game.');
		return await this.db.getItem('new');
	}

	public async removeGame(): Promise<void> {
		console.debug('Setup remove game.');
		this.db.removeItem('new');
	}
}
