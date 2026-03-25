// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LichessAuth   } from './LichessAuth';
import { LichessClient } from './LichessClient';

import { GameHistory   } from '../game/GameHistory';
import { HistoryRecord } from '../game/GameHistory';

const MaxGames = 20;

type LichessGamePlayer = {
	user?:   { name: string; id: string };
	rating?: number;
	aiLevel?: number;
};

type LichessHistoryGame = {
	id:         string;
	createdAt:  number;
	status:     string;
	players:    { white: LichessGamePlayer; black: LichessGamePlayer };
	winner?:    string;
	clock?:     { initial: number; increment: number };
	pgn?:       string;
};

function playerName(p: LichessGamePlayer): string {
	if (p.user) return p.user.name;
	if (p.aiLevel !== undefined) return `Stockfish level ${p.aiLevel}`;
	return 'Anonymous';
}

function gameResult(status: string, winner?: string): string {
	switch (status) {
		case 'aborted':
		case 'noStart':
			return '*';
		case 'draw':
		case 'stalemate':
		case 'repetition':
		case 'insufficient':
			return '1/2-1/2';
		default:
			if (winner === 'white') return '1-0';
			if (winner === 'black') return '0-1';
			return '*';
	}
}

export class LichessHistory {
	private readonly auth:    LichessAuth;
	private readonly client:  LichessClient;
	private readonly history: GameHistory;

	constructor(auth: LichessAuth, client: LichessClient) {
		this.auth    = auth;
		this.client  = client;
		this.history = new GameHistory();
	}

	public async fetchGames(max = MaxGames): Promise<HistoryRecord[]> {
		const user = this.auth.getUser();
		if (!user) {
			throw new Error('Not logged in to Lichess');
		}
		const path   = `/api/games/user/${user.id}?max=${max}&pgnInJson=true&clocks=false&evals=false`;
		const stream = await this.client.getStream(path, { 'Accept': 'application/x-ndjson' });
		const games  = await this.readNdjson(stream);
		const records: HistoryRecord[] = [];
		for (const game of games) {
			const record = this.toHistoryRecord(game);
			await this.history.save(record);
			records.push(record);
		}
		return records;
	}

	private toHistoryRecord(game: LichessHistoryGame): HistoryRecord {
		const date = new Date(game.createdAt).toISOString();
		const white = playerName(game.players.white);
		const black = playerName(game.players.black);
		const result = gameResult(game.status, game.winner);
		const tc = game.clock
			? `${game.clock.initial}+${game.clock.increment}`
			: '-';
		return {
			id:          `lichess-${game.id}`,
			date,
			white,
			black,
			result,
			timeControl: tc,
			pgn:         game.pgn ?? '',
			source:      'lichess',
			lichessId:   game.id,
		};
	}

	private async readNdjson(stream: ReadableStream<Uint8Array>): Promise<LichessHistoryGame[]> {
		const reader  = stream.getReader();
		const decoder = new TextDecoder();
		const games: LichessHistoryGame[] = [];
		let buffer = '';
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';
				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed) continue;
					try {
						games.push(JSON.parse(trimmed) as LichessHistoryGame);
					} catch {
						console.warn('LichessHistory: skipping invalid JSON line');
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
		return games;
	}
}
