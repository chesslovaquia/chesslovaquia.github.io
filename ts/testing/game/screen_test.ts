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
	test('mobile already', () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.location.pathname = '/play/mobile/';
		window.innerWidth = 360;
		window.innerHeight = 640;
		const toggle = screen.screenToggle();
		window.innerWidth = width;
		window.innerHeight = height;
		expect(toggle[0]).toBe('mobile');
		expect(toggle[1]).toBe(false);
	});
});

describe('screenRedirect', () => {
	test('mobile', () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.innerWidth = 360;
		window.innerHeight = 640;
		const mode = screen.screenRedirect();
		window.innerWidth = width;
		window.innerHeight = height;
		expect(mode).toBe('mobile');
	});
	test('desktop', () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.innerWidth = 640;
		window.innerHeight = 360;
		const mode = screen.screenRedirect();
		window.innerWidth = width;
		window.innerHeight = height;
		expect(mode).toBe('desktop');
	});
});
