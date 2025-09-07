// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { clvqInternalError } from './utils';

import { ClvqError } from './ClvqError';

class ClvqDevel {
	public internalError(): void {
		const error = new ClvqError('Fake error message.');
		clvqInternalError(error);
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	console.debug('Chesslovaquia development helper.');
	(window as any).ClvqDevel = new ClvqDevel();
});
