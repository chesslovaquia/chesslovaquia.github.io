// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqIndexedDB } from '../clvq/ClvqIndexedDB';

type setupData = {
	time:      number,
	increment: number,
}

export class GameSetup {
	private readonly db: ClvqIndexedDB;

	constructor() {
		this.db = new ClvqIndexedDB('gameSetup');
	}

	public async newGame(data: setupData): Promise<void> {
		console.debug('Setup new game:', data);
		await this.db.setItem('new', data);
	}
}
