// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function replace(url: string): Promise<void> {
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

function toggleScreen(): Mode {
	const path = window.location.pathname;
	console.debug('Screen toggle:', path);
	console.debug('Window width:', window.innerWidth);
	console.debug('Window height:', window.innerHeight);
	if (window.innerWidth < window.innerHeight) {
		if (path !== '/play/mobile/') {
			console.debug('Screen change to mobile mode.');
			replace('/play/mobile/');
		} else {
			console.debug('Screen already in mobile mode.');
		}
	} else {
		if (path !== '/play/desktop/') {
			console.debug('Screen change to desktop mode.');
			replace('/play/desktop/');
		} else {
			console.debug('Screen already in desktop mode.');
		}
		return 'desktop';
	}
	return 'mobile';
}

async function screenResize(wait: number): Promise<void> {
	console.debug('Screen resize, wait:', wait);
	await sleep(wait);
	toggleScreen();
}

window.addEventListener('resize', () => screenResize(100));

async function screenLoad(wait: number): Promise<void> {
	console.debug('Screen load, wait:', wait);
	await sleep(wait);
	toggleScreen();
}

document.addEventListener('DOMContentLoaded', () => {
	if (window.location.pathname === '/play/') {
		screenLoad(300);
	}
});

// Testing exports.
export const __screen = {
	screenLoad,
	screenResize,
	toggleScreen,
};
