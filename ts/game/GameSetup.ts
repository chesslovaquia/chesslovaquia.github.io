// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { screenLoad } from './screen';

import { ClvqIndexedDB, Store } from '../clvq/ClvqIndexedDB';

type setupData = {
	time:      number,
	increment: number,
}

export class GameSetup {
	private readonly db: ClvqIndexedDB;

	constructor() {
		this.db = new ClvqIndexedDB(Store.state);
	}

	public async newGame(data: setupData): Promise<void> {
		console.debug('Setup new game:', data);
		await this.db.setItem('new', data);
		screenLoad();
	}
}
