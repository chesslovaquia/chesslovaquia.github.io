// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';

import { ChessGameError  } from './ChessGameError';
import { ChessGamePlayer } from './ChessGamePlayer';

type Color = 'w' | 'b';

class ChessGameClock {
	private readonly game: Chess;
	private readonly p1:   ChessGamePlayer;
	private readonly p2:   ChessGamePlayer;

	private initialTime: number;
	private increment:   number;
	private interval:    ReturnType<typeof setInterval> | null;

	private side: Record<Color, ChessGamePlayer>;
	private time: Record<Color, number>;

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
		this.interval    = null;
		this.initialTime = time;
		this.increment   = increment;
	}

	public move(turn: Color): void {
		if (this.increment > 0) {
			this.time[turn] += this.increment;
		}
		this.update(turn);
	}

	public start(): boolean {
		if (this.interval) {
			console.warn('Clock tried to start again!');
			return false;
		}
		console.debug('Clock start:', this.initialTime, this.increment);
		this.interval = setInterval(() => {
			const turn = this.game.turn();
			this.time[turn]--;
			this.update(turn);
		}, 1000);
		return true;
	}

	public stop(): boolean {
		if (this.interval) {
			console.debug('Clock stop.');
			clearInterval(this.interval);
			this.interval = null;
			this.reset();
			return true;
		}
		return false;
	}

	private update(turn: Color): void {
		if (this.side['w'].clock) {
			this.side['w'].clock.textContent = this.format(this.time['w']);
		}
		if (this.side['b'].clock) {
			this.side['b'].clock.textContent = this.format(this.time['b']);
		}
		this.side['w'].clock?.classList.toggle('active', turn === 'w');
		this.side['b'].clock?.classList.toggle('active', turn === 'b');
	}

	private format(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	private reset(): void {
		this.time['w'] = this.initialTime;
		this.time['b'] = this.initialTime;
		if (this.side['w'].clock) {
			this.side['w'].clock.textContent = this.format(this.initialTime);
		}
		if (this.side['b'].clock) {
			this.side['b'].clock.textContent = this.format(this.initialTime);
		}
	}
}

export { ChessGameClock };
