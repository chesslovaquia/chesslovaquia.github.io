// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { __screen } from '../../game/screen';

test('screenLoad', async () => {
	await __screen.screenLoad(0);
});

test('screenResize', async () => {
	await __screen.screenResize(0);
});

describe('toggleScreen', () => {
	test('mobile', () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.innerWidth = 360;
		window.innerHeight = 640;
		const mode = __screen.toggleScreen();
		window.innerWidth = width;
		window.innerHeight = height;
		expect(mode).toBe('mobile');
	});
	test('desktop', () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.innerWidth = 640;
		window.innerHeight = 360;
		const mode = __screen.toggleScreen();
		window.innerWidth = width;
		window.innerHeight = height;
		expect(mode).toBe('desktop');
	});
});
