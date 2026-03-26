// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from './utils';

import { logger } from './Logger';

import { ClvqError } from './ClvqError';

class ClvqDevel {
	public internalError(): void {
		const error = new ClvqError('Fake error message.');
		clvqInternalError(error);
	}
}

declare global {
	interface Window {
		ClvqDevel: ClvqDevel;
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	window.ClvqDevel = new ClvqDevel();
	logger.debug('ClvqDevel loaded.');
});
