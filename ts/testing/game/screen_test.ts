// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, describe, expect } from 'vitest';

import * as screen from '../../game/screen';

test('screenLoad', async () => {
	await screen.screenLoad();
});

test('screenResize', async () => {
	await screen.screenResize(0);
});

describe('screenToggle', () => {
	test('mobile', () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.innerWidth = 360;
		window.innerHeight = 640;
		const mode = screen.screenToggle()[0];
		window.innerWidth = width;
		window.innerHeight = height;
		expect(mode).toBe('mobile');
	});
	test('desktop', () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.innerWidth = 640;
		window.innerHeight = 360;
		const mode = screen.screenToggle()[0];
		window.innerWidth = width;
		window.innerHeight = height;
		expect(mode).toBe('desktop');
	});
});
