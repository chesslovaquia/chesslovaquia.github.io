// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { logger } from '../clvq/Logger';

const screenMobileURL  = '/play/mobile/';
const screenDesktopURL = '/play/desktop/';

export const screenDelay = 300; // ms
const screenSleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type ScreenMode = 'mobile' | 'desktop';

function getScreenMode(): ScreenMode {
	logger.debug('Window width:', window.innerWidth, 'height:', window.innerHeight);
	if (window.innerWidth < window.innerHeight) {
		return 'mobile';
	}
	return 'desktop';
}

async function screenRedirect(mode: ScreenMode, wait: number): Promise<void> {
	logger.debug('Screen redirect:', mode, 'delay:', wait);
	await screenSleep(wait);
	if (mode === 'mobile') {
		window.location.assign(screenMobileURL);
	} else {
		window.location.assign(screenDesktopURL);
	}
}

export function screenToggle(wait: number): [ScreenMode, boolean] {
	const path = window.location.pathname;
	const mode = getScreenMode();
	logger.debug('Screen toggle:', path);
	logger.debug('Screen mode:', mode);
	if (mode === 'mobile') {
		if (path !== screenMobileURL) {
			logger.debug('Screen change to mobile mode.');
			screenRedirect(mode, wait);
			return [mode, true];
		} else {
			logger.debug('Screen already in mobile mode.');
		}
	} else {
		if (path !== screenDesktopURL) {
			logger.debug('Screen change to desktop mode.');
			screenRedirect(mode, wait);
			return [mode, true];
		} else {
			logger.debug('Screen already in desktop mode.');
		}
	}
	return [mode, false];
}

export function screenResize(wait: number): void {
	logger.debug('Screen resize.');
	screenToggle(wait);
}

export function screenLoad(wait: number): boolean {
	logger.debug('Screen load.');
	return screenToggle(wait)[1];
}
