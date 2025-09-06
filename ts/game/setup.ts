// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from '../clvq/utils';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	try {
		console.debug('Game setup page.');
	} catch (error) {
		clvqInternalError(error as Error);
		throw error;
	}
});
