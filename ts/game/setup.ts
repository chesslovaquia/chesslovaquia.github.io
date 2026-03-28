// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { logger } from '../clvq/Logger';

import { GameSetup } from './GameSetup';

window.addEventListener('pageshow', () => {
	try {
		logger.debug('Game setup page.');
		const setup = new GameSetup();
		const game = setup.getGame();
		if (game) {
			logger.debug('Game active:', game);
			window.location.assign('/play/');
		} else {
			logger.debug('No active game.');
		}
	} catch (error) {
		logger.error('Game setup error:', error);
	}
});
