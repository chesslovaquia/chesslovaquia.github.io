// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { logger } from './Logger';

import { ElementIds } from './ElementIds';

export function w3HideMenu(id: string): void {
	let x = document.getElementById(id);
	if (x) {
		x.classList.toggle('active', false);
	}
}

export function w3ToggleMenu(id: string): void {
	let x = document.getElementById(id);
	if (x) {
		if (x.classList.contains("active")) {
			x.classList.toggle('active', false);
		} else {
			x.classList.toggle('active', true);
		}
	} else {
		logger.error('Clvq w3ToggleMenu ERROR:', id, 'not found');
	}
}

export function w3ShowModal(id: string): void {
	let x = document.getElementById(id);
	if (x) {
		x.classList.toggle('active', true);
	} else {
		logger.error('Clvq w3ShowModal ERROR:', id, 'not found');
	}
}

export function w3HideModal(id: string): void {
	let x = document.getElementById(id);
	if (x) {
		x.classList.toggle('active', false);
	} else {
		logger.error('Clvq w3HideModal ERROR:', id, 'not found');
	}
}

export function clvqInternalError(error: Error): void {
	const display = document.getElementById(ElementIds.clvqInternalErrorMessage);
	if (display) {
		display.textContent = error.message;
		w3ShowModal(ElementIds.clvqInternalError);
	} else {
		logger.error('clvqInternalErrorMessage element not found!');
	}
}

export function disableButton(button: HTMLButtonElement | null): void {
	if (button) {
		button.disabled = true;
	}
}

export function enableButton(button: HTMLButtonElement | null): void {
	if (button) {
		button.disabled = false;
	}
}
