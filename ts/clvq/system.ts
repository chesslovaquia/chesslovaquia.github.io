// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ElementIds } from './ElementIds';

function showSystemInfo(pre: HTMLElement): void {
	const MB = 1024 * 1024;

	pre.textContent += `Window innerWidth:  ${window.innerWidth}\n`;
	pre.textContent += `Window innerHeight: ${window.innerHeight}\n`;
	pre.textContent += '\n';

	if ('storage' in navigator && 'estimate' in navigator.storage) {
		navigator.storage.estimate().then(estimate => {
			if (estimate.usage && estimate.quota) {
				const usage = (estimate.usage / MB).toFixed(2);
				pre.textContent += `Storage used:  ${usage} MB\n`;
				const quota = (estimate.quota / MB).toFixed(2);
				pre.textContent += `Storage quota: ${quota} MB\n`;
			}
		});
	}
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const systemInfo = document.getElementById(ElementIds.systemInfo);
	if (systemInfo) {
		showSystemInfo(systemInfo);
	}
})
