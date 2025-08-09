// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';

import { ChessGameError  } from './ChessGameError';
import { ChessGamePlayer } from './ChessGamePlayer';

type Color = 'w' | 'b';

type clockState = {
	tstamp:      number,
	initialTime: number,
	increment:   number,
	time:        Record<Color, number>,
	firstMove:   boolean,
};

class ChessGameClock {
	private readonly game: Chess;
	private readonly p1:   ChessGamePlayer;
	private readonly p2:   ChessGamePlayer;

	private initialTime: number;
	private increment:   number;
	private interval:    ReturnType<typeof setInterval> | null;

	private side:      Record<Color, ChessGamePlayer>;
	private time:      Record<Color, number>;
	private firstMove: boolean;

	constructor(game: Chess, p1: ChessGamePlayer, p2: ChessGamePlayer, time: number, increment: number) {
		console.debug('Clock init:', time, increment);
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
		this.firstMove   = true;
		this.interval    = null;
		this.initialTime = time;
		this.increment   = increment;
		this.reset(); // So the clock display shows proper time.
	}

	public move(turn: Color): void {
		if (this.firstMove && turn === 'b') {
			return;
		}
		if (this.firstMove) {
			this.firstMove = false;
		}
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
		console.debug('Clock start:', this.time);
		this.interval = setInterval(() => {
			const turn = this.game.turn();
			if (this.firstMove) {
				return;
			}
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
			this.update(this.game.turn());
			return true;
		}
		return false;
	}

	private async update(turn: Color): Promise<void> {
		if (this.side[turn].clock) {
			this.side[turn].clock.textContent = this.format(this.time[turn]);
		}
		this.side['w'].clock?.classList.toggle('active', turn === 'w');
		this.side['b'].clock?.classList.toggle('active', turn === 'b');
	}

	private updateAll(): void {
		if (this.side['w'].clock) {
			this.side['w'].clock.textContent = this.format(this.time['w']);
		}
		if (this.side['b'].clock) {
			this.side['b'].clock.textContent = this.format(this.time['b']);
		}
		this.update(this.game.turn());
	}

	private format(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	public reset(): void {
		console.debug('Clock reset.');
		if (this.side['w'].clock) {
			this.side['w'].clock.textContent = this.format(this.initialTime);
			this.side['w'].clock.classList.toggle('active', false);
		}
		if (this.side['b'].clock) {
			this.side['b'].clock.textContent = this.format(this.initialTime);
			this.side['b'].clock.classList.toggle('active', false);
		}
		this.time = {
			'w': this.initialTime,
			'b': this.initialTime,
		};
		this.firstMove = true;
	}

	public getState(): clockState {
		return {
			tstamp:      Date.now(),
			initialTime: this.initialTime,
			increment:   this.increment,
			time:        this.time,
			firstMove:   this.firstMove,
		};
	}

	public setState(s: clockState): void {
		console.debug('Clock set state:', s);
		this.initialTime = s.initialTime;
		this.increment   = s.increment;
		this.time        = s.time;
		this.firstMove   = s.firstMove;
		this.setTimeDiff(s.tstamp);
		this.updateAll();
	}

	private setTimeDiff(tstamp: number): void {
		const diff = Math.floor((Date.now() - tstamp) / 1000);
		console.debug('Clock time diff:', diff, 'seconds');
		if (diff >= 1) {
			this.time[this.game.turn()] -= diff;
		}
	}
}

export { ChessGameClock };
