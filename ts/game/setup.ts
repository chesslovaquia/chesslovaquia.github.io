// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';

import { screenSleep    } from './screen';
import { screenRedirect } from './screen';

import { GameSetup } from './GameSetup';
import { SetupData } from './GameSetup';

console.debug('Game setup event listener.');

window.addEventListener('pageshow', () => {
	try {
		console.debug('Game setup page.');
		const setup = new GameSetup();
		setup.getGame().then((game: SetupData) => {
			if (game) {
				console.debug('Game active:', game);
				screenSleep(300).then(() => {
					screenRedirect();
				});
			} else {
				console.debug('No active game.');
			}
		});
	} catch (error) {
		clvqInternalError(error as Error);
		throw error;
	}
});
