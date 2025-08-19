// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export class Clvq {
	constructor() {
		console.debug('Clvq loaded.');
	}

	public w3ToggleMenu(id: string): void {
		let x = document.getElementById(id);
		if (x) {
			if (x.classList.contains("w3-show")) {
				x.classList.toggle('w3-show', false);
			} else {
				x.classList.toggle('w3-show', true);
			}
		} else {
			console.log('Clvq w3ToggleMenu ERROR:', id, 'not found');
		}
	}

	public w3HideModal(id: string): void {
		let x = document.getElementById(id);
		if (x) {
			x.classList.toggle('w3-show', false);
		} else {
			console.log('Clvq w3HideModal ERROR:', id, 'not found');
		}
	}
}
