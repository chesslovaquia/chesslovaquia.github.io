// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';

import { screenLoad  } from './screen';
import { screenDelay } from './screen';

import { GameSetup } from './GameSetup';
import { SetupData } from './GameSetup';

window.addEventListener('pageshow', () => {
	try {
		console.debug('Game setup page.');
		const setup = new GameSetup();
		setup.getGame().then((game: SetupData) => {
			if (game) {
				console.debug('Game active:', game);
				screenLoad(screenDelay);
			} else {
				console.debug('No active game.');
			}
		});
	} catch (error) {
		clvqInternalError(error as Error);
		throw error;
	}
});
