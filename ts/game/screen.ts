// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

const screenMobileURL  = '/play/mobile/';
const screenDesktopURL = '/play/desktop/';

export const screenDelay = 200; // ms

type ScreenMode = 'mobile' | 'desktop';

function getScreenMode(): ScreenMode {
	console.debug('Window width:', window.innerWidth);
	console.debug('Window height:', window.innerHeight);
	if (window.innerWidth < window.innerHeight) {
		return 'mobile';
	} else {
		return 'desktop';
	}
}

export function screenToggle(): [ScreenMode, boolean] {
	const path = window.location.pathname;
	const mode = getScreenMode();
	console.debug('Screen toggle:', path);
	console.debug('Screen mode:', mode);
	if (mode === 'mobile') {
		if (path !== screenMobileURL) {
			console.debug('Screen change to mobile mode.');
			window.location.replace(screenMobileURL);
			return [mode, true];
		} else {
			console.debug('Screen already in mobile mode.');
		}
	} else {
		if (path !== screenDesktopURL) {
			console.debug('Screen change to desktop mode.');
			window.location.replace(screenDesktopURL);
			return [mode, true];
		} else {
			console.debug('Screen already in desktop mode.');
		}
	}
	return [mode, false];
}

const screenSleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function screenResize(wait: number): void {
	console.debug('Screen resize, wait:', wait);
	screenSleep(wait).then(() => {
		screenToggle();
	});
}

export function screenLoad(): boolean {
	console.debug('Screen load.');
	return screenToggle()[1];
}

export function screenRedirect(): void {
	const mode = getScreenMode();
	console.debug('Screen redirect:', mode);
	if (mode === 'mobile') {
		window.location.href = screenMobileURL;
	} else {
		window.location.href = screenDesktopURL;
	}
}
