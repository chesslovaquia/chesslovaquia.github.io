// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';

import { logger } from '../clvq/Logger';

import { GameSetup } from './GameSetup';
import { SetupData } from './GameSetup';

window.addEventListener('pageshow', () => {
	try {
		logger.debug('Game setup page.');
		const setup = new GameSetup();
		setup.getGame().then((game: SetupData) => {
			if (game) {
				logger.debug('Game active:', game);
				window.location.assign('/play/');
			} else {
				logger.debug('No active game.');
			}
		}).catch((err: unknown) => clvqInternalError(err as Error));
	} catch (error) {
		clvqInternalError(error as Error);
		throw error;
	}
});
