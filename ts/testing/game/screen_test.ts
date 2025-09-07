// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, describe, expect, beforeEach } from 'vitest';

import * as screen from '../../game/screen';

const noDelay = 0;

beforeEach(() => {
	window.location.pathname = '/';
});

test('screenLoad', async () => {
	const loaded = await screen.screenLoad(noDelay);
	expect(loaded).toBe(true);
});

test('screenResize', async () => {
	await screen.screenResize(noDelay);
});

describe('screenToggle', () => {
	test('mobile', () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.innerWidth = 360;
		window.innerHeight = 640;
		const mode = screen.screenToggle(noDelay)[0];
		window.innerWidth = width;
		window.innerHeight = height;
		expect(mode).toBe('mobile');
	});
	test('desktop', () => {
		const width = window.innerWidth;
		const height = window.innerHeight;
		window.innerWidth = 640;
		window.innerHeight = 360;
		const mode = screen.screenToggle(noDelay)[0];
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
		const toggle = screen.screenToggle(noDelay);
		window.innerWidth = width;
		window.innerHeight = height;
		expect(toggle[0]).toBe('mobile');
		expect(toggle[1]).toBe(false);
	});
});
