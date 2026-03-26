// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';

import { logger } from '../clvq/Logger';

import { screenLoad  } from './screen';
import { screenDelay } from './screen';

import { GameSetup } from './GameSetup';
import { SetupData } from './GameSetup';

window.addEventListener('pageshow', () => {
	try {
		logger.debug('Game setup page.');
		const setup = new GameSetup();
		setup.getGame().then((game: SetupData) => {
			if (game) {
				logger.debug('Game active:', game);
				screenLoad(screenDelay);
			} else {
				logger.debug('No active game.');
			}
		});
	} catch (error) {
		clvqInternalError(error as Error);
		throw error;
	}
});
