// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export function w3ToggleMenu(id: string): void {
	let x = document.getElementById(id);
	if (x) {
		if (x.classList.contains("w3-show")) {
			x.classList.toggle('w3-show', false);
		} else {
			x.classList.toggle('w3-show', true);
		}
	} else {
		console.error('Clvq w3ToggleMenu ERROR:', id, 'not found');
	}
}

export function w3ShowModal(id: string): void {
	let x = document.getElementById(id);
	if (x) {
		x.classList.toggle('w3-show', true);
	} else {
		console.error('Clvq w3ShowModal ERROR:', id, 'not found');
	}
}

export function w3HideModal(id: string): void {
	let x = document.getElementById(id);
	if (x) {
		x.classList.toggle('w3-show', false);
	} else {
		console.error('Clvq w3HideModal ERROR:', id, 'not found');
	}
}

export function clvqInternalError(error: Error): void {
	const display = document.getElementById('clvqInternalErrorMessage');
	if (display) {
		display.textContent = error.message;
		w3ShowModal('clvqInternalError');
	} else {
		console.error('clvqInternalErrorMessage element not found!');
	}
}
