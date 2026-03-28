// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { w3ShowModal } from './utils';

import { logger } from './Logger';

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
			.catch((err: unknown) => { logger.error('Load history error:', err); });
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
			.catch((err: unknown) => { logger.error('Lichess history error:', err); });
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
		listEl.replaceChildren();
		if (records.length === 0) {
			listEl.innerHTML = '<p class="history-empty">No games yet.</p>';
			return;
		}
		records.forEach((r, i) => {
			const dateStr = r.date.slice(0, 10);
			const src     = r.source === 'lichess' ? ' [lichess]' : '';

			const rowDiv = document.createElement('div');
			rowDiv.className = 'history-row';

			const dateSpan = document.createElement('span');
			dateSpan.className = 'history-date';
			dateSpan.textContent = dateStr + src;

			const nameSpan = document.createElement('span');
			nameSpan.className = 'history-name';
			nameSpan.textContent = r.white + ' vs ' + r.black;

			const resultSpan = document.createElement('span');
			resultSpan.className = 'history-result';
			resultSpan.textContent = r.result;

			const tcSpan = document.createElement('span');
			tcSpan.className = 'history-tc';
			tcSpan.textContent = r.timeControl;

			const pgnBtn = document.createElement('button');
			pgnBtn.className = 'btn history-pgn';
			pgnBtn.textContent = 'PGN';
			pgnBtn.addEventListener('click', () => { this.exportPgn(i); });

			rowDiv.appendChild(dateSpan);
			rowDiv.appendChild(nameSpan);
			rowDiv.appendChild(resultSpan);
			rowDiv.appendChild(tcSpan);
			rowDiv.appendChild(pgnBtn);
			listEl.appendChild(rowDiv);
		});
	}
}
