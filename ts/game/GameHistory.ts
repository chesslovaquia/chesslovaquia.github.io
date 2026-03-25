// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqIndexedDB, Store } from '../clvq/ClvqIndexedDB';

export type HistoryRecord = {
	id:          string;
	date:        string;
	white:       string;
	black:       string;
	result:      string;
	timeControl: string;
	pgn:         string;
	source:      'local' | 'lichess';
	lichessId?:  string;
}

export class GameHistory {
	private readonly db: ClvqIndexedDB;

	constructor() {
		this.db = new ClvqIndexedDB(Store.history);
	}

	public async save(record: HistoryRecord): Promise<void> {
		await this.db.setItem(record.id, record);
	}

	public async list(): Promise<HistoryRecord[]> {
		const all = await this.db.getAll() as HistoryRecord[];
		return all.sort((a, b) => b.date.localeCompare(a.date));
	}

	public async delete(id: string): Promise<void> {
		await this.db.removeItem(id);
	}
}
