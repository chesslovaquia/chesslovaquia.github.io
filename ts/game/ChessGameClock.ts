// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';

import { ChessGameError  } from './ChessGameError';
import { ChessGamePlayer } from './ChessGamePlayer';

import { ClockTimeout } from './events';

import { Color } from './types';

type clockClass = 'active' | 'warning' | 'alert';

type clockState = {
	tstamp:        number,
	initialTime:   number,
	increment:     number,
	time:          Record<Color, number>,
	firstMove:     boolean,
	firstMoveTime: Record<Color, number>,
};

const firstMoveTimeout: number = 30 * 10; // 30 seconds in tenths.
const activeWarning:    number = 30 * 10; // 30 seconds in tenths.
const activeAlert:      number = 10 * 10; // 10 seconds in tenths.

class ChessGameClock {
	private readonly game: Chess;
	private readonly p1:   ChessGamePlayer;
	private readonly p2:   ChessGamePlayer;

	private initialTime: number;
	private increment:   number;
	private interval:    ReturnType<typeof setInterval> | null;

	private side:  Record<Color, ChessGamePlayer>;
	private time:  Record<Color, number>;
	private klass: Record<Color, clockClass>;

	private firstMove:         boolean;
	private firstMoveTime:     Record<Color, number>;
	private firstMoveInterval: ReturnType<typeof setInterval> | null;

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
		this.initialTime = time * 10;
		this.increment   = increment * 10;
		this.time = {
			'w': this.initialTime,
			'b': this.initialTime,
		};
		this.klass = {
			'w': 'active',
			'b': 'active',
		};
		this.firstMoveTime = {
			'w': firstMoveTimeout,
			'b': firstMoveTimeout,
		};
		this.firstMoveInterval = null;
		this.firstMove         = true;
		this.interval          = null;
		this.reset(); // So the clock display shows proper time.
	}

	public move(turn: Color): void {
		if (this.increment > 0) {
			const other = turn === 'w' ? 'b' : 'w';
			this.time[other] += this.increment;
		}
		if (this.firstMove && turn === 'b') {
			this.update(turn);
			return;
		}
		if (this.firstMove) {
			this.firstMove = false;
			if (this.firstMoveInterval) {
				clearInterval(this.firstMoveInterval);
			}
		}
		this.update(turn);
	}

	public start(): boolean {
		if (this.interval) {
			console.warn('Clock tried to start again!');
			return false;
		}
		console.debug('Clock start:', this.firstMoveTime, this.time);
		// First move timer.
		if (this.firstMove) {
			this.firstMoveInterval = setInterval(() => {
				this.firstMoveTimer();
			}, 100);
		}
		// Clock timer.
		this.interval = setInterval(() => {
			this.timer();
		}, 100);
		return true;
	}

	public stop(): boolean {
		if (this.firstMoveInterval) {
			clearInterval(this.firstMoveInterval);
		}
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
		if (this.time[turn] <= activeAlert) {
			this.klass[turn] = 'alert';
			this.side[turn].clock?.classList.toggle('warning', false);
		} else if (this.time[turn] <= activeWarning) {
			this.klass[turn] = 'warning';
			this.side[turn].clock?.classList.toggle('active', false);
		}
		if (this.side['w'].clock) {
			this.side['w'].clock.textContent = this.format(this.time['w']);
			const klass = this.klass['w'];
			this.side['w'].clock.classList.toggle(klass, turn === 'w');
		}
		if (this.firstMove) {
			return;
		}
		if (this.side['b'].clock) {
			this.side['b'].clock.textContent = this.format(this.time['b']);
			const klass = this.klass['b'];
			this.side['b'].clock.classList.toggle(klass, turn === 'b');
		}
	}

	private format(ts: number): string {
		const seconds = ts / 10;
		if (seconds === 0) {
			return '00:00';
		}
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	public reset(): void {
		console.debug('Clock reset.');
		if (this.side['w'].clock) {
			this.side['w'].clock.textContent = this.format(this.initialTime);
			this.side['w'].clock.classList.toggle('active', false);
			this.side['w'].clock.classList.toggle('warning', false);
			this.side['w'].clock.classList.toggle('alert', false);
		}
		if (this.side['b'].clock) {
			this.side['b'].clock.textContent = this.format(this.initialTime);
			this.side['b'].clock.classList.toggle('active', false);
			this.side['b'].clock.classList.toggle('warning', false);
			this.side['b'].clock.classList.toggle('alert', false);
		}
		this.time = {
			'w': this.initialTime,
			'b': this.initialTime,
		};
		this.klass = {
			'w': 'active',
			'b': 'active',
		};
		this.firstMoveTime = {
			'w': firstMoveTimeout,
			'b': firstMoveTimeout,
		};
		this.firstMove = true;
	}

	public getState(): clockState {
		return {
			tstamp:        Date.now(),
			initialTime:   this.initialTime,
			increment:     this.increment,
			time:          this.time,
			firstMove:     this.firstMove,
			firstMoveTime: this.firstMoveTime,
		};
	}

	public setState(s: clockState): void {
		console.debug('Clock set state:', s);
		this.initialTime   = s.initialTime;
		this.increment     = s.increment;
		this.time          = s.time;
		this.firstMove     = s.firstMove;
		this.firstMoveTime = s.firstMoveTime;
		this.setTimeDiff(s.tstamp);
		this.update(this.game.turn());
	}

	private setTimeDiff(tstamp: number): void {
		const diff = Math.floor(Date.now() - tstamp) / 100;
		console.debug('Clock time diff:', diff);
		const turn = this.game.turn();
		this.time[turn] -= diff;
		if (this.time[turn] <= 0) {
			this.time[turn] = 0;
		}
		if (this.firstMove) {
			this.firstMoveTime[turn] -= diff;
			if (this.firstMoveTime[turn] <= 0) {
				this.firstMoveTime[turn] = 0;
			}
		}
	}

	private firstMoveTimer(): void {
		if (!this.firstMove) {
			return;
		}
		const turn = this.game.turn();
		this.firstMoveTime[turn]--;
		console.debug('First move timer:', turn, this.firstMoveTime[turn]);
		if (this.firstMoveTime[turn] <= 0) {
			this.firstMoveTime[turn] = 0;
			const evt = new ClockTimeout(turn);
			document.dispatchEvent(evt);
		}
	}

	private timer(): void {
		if (this.firstMove) {
			return;
		}
		const turn = this.game.turn();
		this.time[turn]--;
		if (this.time[turn] <= 0) {
			this.time[turn] = 0;
			const evt = new ClockTimeout(turn);
			this.update(turn);
			document.dispatchEvent(evt);
			return;
		}
		this.update(turn);
	}
}

export { ChessGameClock };
