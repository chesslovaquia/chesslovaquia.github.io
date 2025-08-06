// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';

import { ChessGameError  } from './ChessGameError';
import { ChessGamePlayer } from './ChessGamePlayer';

class ChessGameClock {
	private readonly game: Chess;
	private readonly p1:   ChessGamePlayer;
	private readonly p2:   ChessGamePlayer;

	private increment: number;
	private interval:  ReturnType<typeof setInterval> | null;

	private side: Record<'w' | 'b', ChessGamePlayer>;
	private time: Record<'w' | 'b', number>;

	constructor(game: Chess, p1: ChessGamePlayer, p2: ChessGamePlayer, time: number, increment: number) {
		if (time < 0 || increment < 0) {
			throw new ChessGameError(`Invalid clock time (${time}) or increment (${increment})`);
		}
		this.game = game;
		this.p1   = p1;
		this.p2   = p2;
		this.side = {
			'w': this.p1,
			'b': this.p2,
		};
		this.time = {
			'w': time,
			'b': time,
		};
		this.interval  = null;
		this.increment = increment;
	}

	public setTime(secs: number): void {
		if (secs < 0) {
			throw new ChessGameError(`Invalid clock time: ${secs}`);
		}
		this.time = {
			'w': secs,
			'b': secs,
		};
	}

	public setIncrement(secs: number): void {
		if (secs < 0) {
			throw new ChessGameError(`Invalid clock increment: ${secs}`);
		}
		this.increment = secs;
	}

	public start(): boolean {
		if (this.interval) {
			console.warn('Clock tried to start again!');
			return false;
		}
		console.debug('Clock start:', this.time, this.increment);
		this.interval = setInterval(() => {
		});
		return true;
	}

	public stop(): boolean {
		if (this.interval) {
			console.debug('Clock stop.');
			clearInterval(this.interval);
			this.interval = null;
			return true;
		}
		return false;
	}
}

export { ChessGameClock };
