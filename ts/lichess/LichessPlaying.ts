// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LichessClient } from './LichessClient';

export type NowPlayingGame = {
	gameId:      string;
	fullId:      string;
	color:       string;
	fen:         string;
	hasMoved:    boolean;
	isMyTurn:    boolean;
	lastMove:    string;
	opponent:    { id: string; username: string; rating?: number };
	speed:       string;
	secondsLeft?: number;
	variant:     { key: string; name: string };
	days?:       number;
};

export class LichessPlaying {
	private readonly client: LichessClient;

	constructor(client: LichessClient) {
		this.client = client;
	}

	public async fetchNowPlaying(): Promise<NowPlayingGame[]> {
		const resp = await this.client.get('/api/account/playing');
		const data = await resp.json() as { nowPlaying: NowPlayingGame[] };
		return data.nowPlaying ?? [];
	}
}
