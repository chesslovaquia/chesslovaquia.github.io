// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const screenDelay = 200; // ms

async function screenReplace(url: string): Promise<void> {
	try {
		const resp = await fetch(url, { method: 'HEAD' });
		if (resp.ok) {
			window.location.replace(url);
		} else {
			console.error('Screen replace check failed!');
		}
	} catch (err) {
		console.error('Screen replace failed:', err);
	}
}

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
			screenReplace('/play/mobile/');
		} else {
			console.debug('Screen already in mobile mode.');
		}
	} else {
		if (path !== '/play/desktop/') {
			console.debug('Screen change to desktop mode.');
			screenReplace('/play/desktop/');
		} else {
			console.debug('Screen already in desktop mode.');
		}
	}
	return mode;
}

export async function screenResize(wait: number): Promise<void> {
	console.debug('Screen resize, wait:', wait);
	await sleep(wait);
	screenToggle();
}

window.addEventListener('resize', () => screenResize(screenDelay));

export async function screenLoad(): Promise<void> {
	console.debug('Screen load.');
	screenToggle();
}
