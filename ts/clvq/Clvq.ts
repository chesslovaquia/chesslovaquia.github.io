// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { w3ToggleMenu } from './utils';
import { w3ShowModal  } from './utils';
import { w3HideModal  } from './utils';

import { GameSetup } from '../game/GameSetup';

export class Clvq {
	constructor() {
		console.debug('Clvq loaded.');
	}

	public w3ToggleMenu(id: string): void {
		w3ToggleMenu(id);
	}

	public w3HideModal(id: string): void {
		w3HideModal(id);
	}

	public w3ShowModal(id: string): void {
		w3ShowModal(id);
	}

	public gameSetup(timeMinutes: number, incrementSeconds: number): void {
		const s = new GameSetup();
		s.newGame({
			time: timeMinutes * 60,
			increment: incrementSeconds,
			desc: `${timeMinutes}+${incrementSeconds}`,
		});
	}

	public gameSetupCorrespondence(days: number): void {
		let unit = 'days';
		if (days === 1) {
			unit = 'day';
		}
		const time = days * 86400;
		const s = new GameSetup();
		s.newGame({
			time: time,
			increment: 0,
			desc: `${days} ${unit}`,
			correspondence: true,
		});
	}
}
