// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ChessGameError } from './ChessGameError';

class ChessGameClock {
	private time: number;
	private increment: number;

	private interval: ReturnType<typeof setInterval> | null;

	constructor(time: number, increment: number) {
		this.time = time;
		this.increment = increment;
		if (this.time < 0 || this.increment < 0) {
			throw new ChessGameError(`Invalid clock time (${time}) or increment (${increment})`);
		}
		this.interval = null;
	}

	public setTime(secs: number): void {
		if (secs < 0) {
			throw new ChessGameError(`Invalid clock time: ${secs}`);
		}
		this.time = secs;
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
