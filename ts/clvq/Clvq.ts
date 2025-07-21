// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqIndexedDB } from './ClvqIndexedDB';

const dbName    = 'clvqDB';
const dbStore   = 'main';
const dbVersion = 1;

class Clvq {
	private readonly db: ClvqIndexedDB;

	constructor() {
		console.debug('Clvq loaded.');
		this.db = new ClvqIndexedDB(dbName, dbStore, dbVersion);
	}

	public async init(): Promise<void> {
		await this.db.setItem('dbVersion', `${dbVersion}`);
	}

	public w3ToggleMenu(id: string): void {
		let x = document.getElementById(id);
		if (x) {
			if (x.className.indexOf("w3-show") === -1) {
				x.className += " w3-show";
			} else {
				x.className = x.className.replace(" w3-show", "");
			}
		} else {
			console.log('Clvq w3ToggleMenu ERROR:', id, 'not found');
		}
	}
}

export { Clvq }
