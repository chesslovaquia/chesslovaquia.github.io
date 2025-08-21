// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Chess } from 'chess.js';

import { EventClockTimeout } from '../events/EventClockTimeout';

import { GameError  } from './GameError';
import { GamePlayer } from './GamePlayer';

import { Color } from './types';

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

enum Status {
	active  = 'active',
	warning = 'warning',
	alert   = 'alert',
	timeout = 'timeout',
}

export class GameClock {
	private readonly game: Chess;
	private readonly p1:   GamePlayer;
	private readonly p2:   GamePlayer;

	private initialTime: number;
	private increment:   number;
	private interval:    ReturnType<typeof setInterval> | null;

	private side:  Record<Color, GamePlayer>;
	private time:  Record<Color, number>;
	private klass: Record<Color, Status>;

	private firstMove:         boolean;
	private firstMoveTime:     Record<Color, number>;
	private firstMoveInterval: ReturnType<typeof setInterval> | null;

	constructor(game: Chess, p1: GamePlayer, p2: GamePlayer, time: number, increment: number) {
		console.debug('Clock init:', time, increment);
		if (time < 0 || increment < 0) {
			throw new GameError(`Invalid clock time (${time}) or increment (${increment})`);
		}
		this.game              = game;
		this.p1                = p1;
		this.p2                = p2;
		this.side              = {'w': this.p1, 'b': this.p2};
		this.initialTime       = time * 10;
		this.increment         = increment * 10;
		this.time              = {'w': 0, 'b': 0};
		this.klass             = {'w': Status.active, 'b': Status.active};
		this.firstMoveTime     = {'w': 0, 'b': 0};
		this.firstMoveInterval = null;
		this.firstMove         = true;
		this.interval          = null;
		this.reset();
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
		if (this.klass[turn] !== Status.timeout) {
			if (this.time[turn] <= activeAlert) {
				this.klass[turn] = Status.alert;
				this.side[turn].clock?.classList.toggle(Status.warning, false);
			} else if (this.time[turn] <= activeWarning) {
				this.klass[turn] = Status.warning;
				this.side[turn].clock?.classList.toggle(Status.active, false);
			}
		}
		if (this.side['w'].clock) {
			this.side['w'].clock.textContent = this.format(this.time['w']);
		}
		if (this.side['b'].clock) {
			this.side['b'].clock.textContent = this.format(this.time['b']);
		}
		if (!this.firstMove) {
			this.side['w'].clock?.classList.toggle(this.klass['w'], turn === 'w');
			this.side['b'].clock?.classList.toggle(this.klass['b'], turn === 'b');
		}
	}

	private format(ts: number): string {
		const seconds = ts / 10;
		if (seconds === 0) {
			return '00:00';
		}
		if (seconds < 10) {
			const secs = Math.floor(seconds % 60);
			const tenths = Math.floor(ts % 10);
			return `${secs.toString().padStart(2, '0')}.${tenths.toString().padStart(1, '0')}`;
		} else {
			const mins = Math.floor(seconds / 60);
			const secs = Math.floor(seconds % 60);
			return `${mins}:${secs.toString().padStart(2, '0')}`;
		}
	}

	public reset(): void {
		console.debug('Clock reset.');
		if (this.side['w'].clock) {
			this.side['w'].clock.textContent = this.format(this.initialTime);
		}
		if (this.side['b'].clock) {
			this.side['b'].clock.textContent = this.format(this.initialTime);
		}
		Object.values(Status).forEach(status => {
			this.side['w'].clock?.classList.toggle(status, false);
			this.side['b'].clock?.classList.toggle(status, false);
		});
		this.klass         = {'w': Status.active,    'b': Status.active};
		this.time          = {'w': this.initialTime, 'b': this.initialTime};
		this.firstMoveTime = {'w': firstMoveTimeout, 'b': firstMoveTimeout};
		this.firstMove     = true;
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

	public setupNewGame(time: number, increment: number): void {
		this.initialTime = time * 10;
		this.increment   = increment * 10;
		this.reset();
	}

	private setTimeDiff(tstamp: number): void {
		const diff = Math.floor(Date.now() - tstamp) / 100;
		console.debug('Clock time diff:', diff);
		const turn = this.game.turn();
		if (this.firstMove) {
			this.firstMoveTime[turn] -= diff;
			if (this.firstMoveTime[turn] <= 0) {
				this.firstMoveTime[turn] = 0;
			}
		} else {
			this.time[turn] -= diff;
			if (this.time[turn] <= 0) {
				this.time[turn] = 0;
			}
		}
	}

	private firstMoveTimer(): void {
		if (!this.firstMove) {
			return;
		}
		const turn = this.game.turn();
		this.firstMoveTime[turn]--;
		if (this.firstMoveTime[turn] <= 0) {
			this.firstMoveTime[turn] = 0;
			this.timeout(turn);
		}
	}

	private timer(): void {
		if (this.firstMove) {
			return;
		}
		const turn = this.game.turn();
		this.time[turn]--;
		if (this.time[turn] <= 0) {
			this.timeout(turn);
			return;
		}
		this.update(turn);
	}

	private timeout(turn: Color): void {
		console.debug('Clock timeout:', turn);
		const evt = new EventClockTimeout(turn);
		EventClockTimeout.Target.dispatchEvent(evt);
		this.firstMove = false;
		this.time[turn] = 0;
		this.klass[turn] = Status.timeout;
		this.update(turn);
	}
}
