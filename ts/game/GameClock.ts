// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';

import { EventClockTimeout } from '../events/EventClockTimeout';

import { GamePlayer } from './GamePlayer';

export type ClockState = {
	tstamp:        number,
	initialTime:   number,
	increment:     number,
	time:          Record<EngineColor, number>,
	firstMove:     boolean,
	firstMoveTime: Record<EngineColor, number>,
};

const initialTime:      number = 900 * 10; // In seconds thenths.
const initialIncrement: number = 10 * 10;  // In seconds thenths.
const firstMoveTimeout: number = 30 * 10; // 30 seconds in tenths.
const activeWarning:    number = 30 * 10; // 30 seconds in tenths.
const activeAlert:      number = 10 * 10; // 10 seconds in tenths.
const firstMoveWarning: string = '30 seconds for the first move';

enum Status {
	active  = 'active',
	warning = 'warning',
	alert   = 'alert',
	timeout = 'timeout',
}

export class GameClock {
	private readonly engine: GameEngine;
	private readonly p1:     GamePlayer;
	private readonly p2:     GamePlayer;

	private initialTime: number;
	private increment:   number;
	private interval:    ReturnType<typeof setInterval> | null;

	private side:  Record<EngineColor, GamePlayer>;
	private time:  Record<EngineColor, number>;
	private klass: Record<EngineColor, Status>;

	private firstMove:         boolean;
	private firstMoveTime:     Record<EngineColor, number>;
	private firstMoveInterval: ReturnType<typeof setInterval> | null;

	private orientation: EngineColor;

	constructor(engine: GameEngine, p1: GamePlayer, p2: GamePlayer) {
		this.engine            = engine;
		this.p1                = p1;
		this.p2                = p2;
		this.side              = {'w': this.p1, 'b': this.p2};
		this.initialTime       = initialTime;
		this.increment         = initialIncrement;
		this.time              = {'w': 0, 'b': 0};
		this.klass             = {'w': Status.active, 'b': Status.active};
		this.firstMoveTime     = {'w': 0, 'b': 0};
		this.firstMoveInterval = null;
		this.firstMove         = true;
		this.interval          = null;
		this.orientation       = 'w';
		this.init();
	}

	private init(): void {
		console.debug('Clock init.');
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

	public move(turn: EngineColor): void {
		console.debug('Clock move:', turn);
		if (this.increment > 0) {
			const other = turn === 'w' ? 'b' : 'w';
			this.time[other] += this.increment;
		}
		if (this.firstMove && turn === 'b') {
			return;
		}
		if (this.firstMove) {
			this.firstMove = false;
			if (this.side['b'].info) {
				this.side['b'].info.textContent = '';
			}
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
			const turn = this.engine.turn();
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
			this.update(this.engine.turn());
			return true;
		}
		return false;
	}

	private async update(turn: EngineColor): Promise<void> {
		if (this.firstMove) {
			if (turn === 'b') {
				if (this.side['w'].clock) {
					this.side['w'].clock.textContent = this.format(this.time['w']);
					this.side['w'].clock.classList.toggle(Status.active, false);
				}
				if (this.side['w'].info) {
					this.side['w'].info.textContent = '';
				}
			} else {
				if (this.side['b'].clock) {
					this.side['b'].clock.textContent = this.format(this.firstMoveTime['b']);
				}
			}
			if (this.side[turn].clock) {
				this.side[turn].clock.textContent = this.format(this.firstMoveTime[turn]);
				this.side[turn].clock.classList.toggle(Status.active, true);
			}
			if (this.side[turn].info) {
				this.side[turn].info.textContent = firstMoveWarning;
			}
		} else {
			if (this.side['w'].clock) {
				this.side['w'].clock.textContent = this.format(this.time['w']);
			}
			if (this.side['b'].clock) {
				this.side['b'].clock.textContent = this.format(this.time['b']);
			}
			if (this.klass[turn] !== Status.timeout) {
				if (this.time[turn] <= activeAlert) {
					this.klass[turn] = Status.alert;
					this.side[turn].clock?.classList.toggle(Status.warning, false);
				} else if (this.time[turn] <= activeWarning) {
					this.klass[turn] = Status.warning;
					this.side[turn].clock?.classList.toggle(Status.active, false);
				}
			}
			this.side['w'].clock?.classList.toggle(this.klass['w'], turn === 'w');
			this.side['b'].clock?.classList.toggle(this.klass['b'], turn === 'b');
		}
	}

	private format(ts: number): string {
		const seconds = ts / 10;
		if (seconds === 0) {
			return '00:00';
		}
		if (seconds < 10) { // Tenths of seconds.
			const secs = Math.floor(seconds % 60);
			const tenths = Math.floor(ts % 10);
			return `${secs}.${tenths}`;
		} else if (seconds < 3600) { // Less than 1 hour.
			const mins = Math.floor(seconds / 60);
			const secs = Math.floor(seconds % 60);
			return `${mins}:${secs.toString().padStart(2, '0')}`;
		} else if (seconds < 86400) { // Less than 1 day.
			const hours = Math.floor(seconds / 3600);
			const mins = Math.floor((seconds % 3600) / 60);
			return `${hours}h ${mins}m`;
		} else { // 1 day or more.
			const days = Math.floor(seconds / 86400);
			const hours = Math.floor((seconds % 86400) / 3600);
			return `${days}d ${hours}h`;
		}
	}

	public getState(): ClockState {
		return {
			tstamp:        Date.now(),
			initialTime:   this.initialTime,
			increment:     this.increment,
			time:          this.time,
			firstMove:     this.firstMove,
			firstMoveTime: this.firstMoveTime,
		};
	}

	public setState(s: ClockState): void {
		console.debug('Clock set state:', s);
		this.initialTime   = s.initialTime;
		this.increment     = s.increment;
		this.time          = s.time;
		this.firstMove     = s.firstMove;
		this.firstMoveTime = s.firstMoveTime;
		this.setTimeDiff(s.tstamp);
		this.update(this.engine.turn());
	}

	public setupNewGame(timeSeconds: number, incrementSeconds: number): void {
		this.initialTime = timeSeconds * 10;
		this.increment = incrementSeconds * 10;
		this.init();
	}

	private setTimeDiff(tstamp: number): void {
		const turn = this.engine.turn();
		const diff = Math.floor(Date.now() - tstamp) / 100;
		console.debug('Clock set time diff:', turn, diff);
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
		const turn = this.engine.turn();
		this.firstMoveTime[turn]--;
		if (this.firstMoveTime[turn] <= 0) {
			this.firstMoveTime[turn] = 0;
			this.timeout(turn);
		}
		this.update(turn);
	}

	private timer(): void {
		if (this.firstMove) {
			return;
		}
		const turn = this.engine.turn();
		this.time[turn]--;
		if (this.time[turn] <= 0) {
			this.timeout(turn);
			return;
		}
		this.update(turn);
	}

	private timeout(turn: EngineColor): void {
		console.debug('Clock timeout:', turn);
		const evt = new EventClockTimeout(turn);
		EventClockTimeout.Target.dispatchEvent(evt);
		this.firstMove = false;
		this.time[turn] = 0;
		this.klass[turn] = Status.timeout;
		this.update(turn);
	}

	public flip(): void {
		const turn = this.engine.turn();
		console.debug('Clock flip orientation:', this.orientation, ', turn:', turn);
		if (this.firstMove) {
			if (this.side[turn].info) {
				this.side[turn].info.textContent = '';
			}
			this.side[turn].clock?.classList.toggle(Status.active, false);
		}
		if (this.orientation === 'w') {
			this.side = {'w': this.p2, 'b': this.p1};
			this.orientation = 'b';
		} else {
			this.side = {'w': this.p1, 'b': this.p2};
			this.orientation = 'w';
		}
		this.update(turn);
	}
}
