// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { w3ShowModal } from './utils';

import { ElementIds } from './ElementIds';

import { LichessAuth   } from '../lichess/LichessAuth';
import { LichessClient } from '../lichess/LichessClient';
import { LichessHistory } from '../lichess/LichessHistory';

import { GameHistory } from '../game/GameHistory';
import type { HistoryRecord } from '../game/GameHistory';

export class HistoryManager {
	private historyRecords: HistoryRecord[] = [];

	public load(): void {
		const history = new GameHistory();
		history.list()
			.then((records) => {
				this.historyRecords = records;
				this.renderHistoryList(records);
				w3ShowModal(ElementIds.gameHistoryModal);
			})
			.catch((err: unknown) => { console.error('Load history error:', err); });
	}

	public loadFromLichess(auth: LichessAuth): void {
		const client = new LichessClient(auth);
		const hist   = new LichessHistory(auth, client);
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
}
