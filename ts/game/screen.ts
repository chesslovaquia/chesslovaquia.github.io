// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export const screenDelay = 200; // ms

type Mode = 'mobile' | 'desktop';

function screenMode(): Mode {
	console.debug('Window width:', window.innerWidth);
	console.debug('Window height:', window.innerHeight);
	if (window.innerWidth < window.innerHeight) {
		return 'mobile';
	} else {
		return 'desktop';
	}
}

export function screenToggle(): Mode {
	const path = window.location.pathname;
	const mode = screenMode();
	console.debug('Screen toggle:', path);
	console.debug('Screen mode:', mode);
	if (mode === 'mobile') {
		if (path !== '/play/mobile/') {
			console.debug('Screen change to mobile mode.');
			window.location.replace('/play/mobile/');
		} else {
			console.debug('Screen already in mobile mode.');
		}
	} else {
		if (path !== '/play/desktop/') {
			console.debug('Screen change to desktop mode.');
			window.location.replace('/play/desktop/');
		} else {
			console.debug('Screen already in desktop mode.');
		}
	}
	return mode;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function screenResize(wait: number): Promise<void> {
	console.debug('Screen resize, wait:', wait);
	await sleep(wait);
	screenToggle();
}

export async function screenLoad(): Promise<void> {
	console.debug('Screen load.');
	screenToggle();
}
