// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

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

function toggleScreen(): void {
	const path = window.location.pathname;
	console.debug('Screen:', path);
	if (window.innerWidth < 768) {
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
	}
}

window.addEventListener('resize', toggleScreen);
window.addEventListener('load', toggleScreen);
