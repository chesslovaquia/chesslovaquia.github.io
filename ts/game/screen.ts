// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

const screenMobileURL  = '/play/mobile/';
const screenDesktopURL = '/play/desktop/';

export const screenDelay = 300; // ms
const screenSleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type ScreenMode = 'mobile' | 'desktop';

function getScreenMode(): ScreenMode {
	console.debug('Window width:', window.innerWidth, 'height:', window.innerHeight);
	if (window.innerWidth < window.innerHeight) {
		return 'mobile';
	}
	return 'desktop';
}

async function screenRedirect(mode: ScreenMode, wait: number): Promise<void> {
	console.debug('Screen redirect:', mode, 'delay:', wait);
	await screenSleep(wait);
	if (mode === 'mobile') {
		window.location.href = screenMobileURL;
	} else {
		window.location.href = screenDesktopURL;
	}
}

export function screenToggle(wait: number): [ScreenMode, boolean] {
	const path = window.location.pathname;
	const mode = getScreenMode();
	console.debug('Screen toggle:', path);
	console.debug('Screen mode:', mode);
	if (mode === 'mobile') {
		if (path !== screenMobileURL) {
			console.debug('Screen change to mobile mode.');
			screenRedirect(mode, wait);
			return [mode, true];
		} else {
			console.debug('Screen already in mobile mode.');
		}
	} else {
		if (path !== screenDesktopURL) {
			console.debug('Screen change to desktop mode.');
			screenRedirect(mode, wait);
			return [mode, true];
		} else {
			console.debug('Screen already in desktop mode.');
		}
	}
	return [mode, false];
}

export function screenResize(wait: number): void {
	console.debug('Screen resize.');
	screenToggle(wait);
}

export function screenLoad(wait: number): boolean {
	console.debug('Screen load.');
	return screenToggle(wait)[1];
}
