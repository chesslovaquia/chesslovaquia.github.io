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

document.addEventListener('DOMContentLoaded', () => {
	if (window.innerWidth < 768) {
		replace('/play/mobile/');
	} else {
		replace('/play/desktop/');
	}
});
