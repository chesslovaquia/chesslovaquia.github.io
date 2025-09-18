// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { test, describe, expect, beforeEach } from 'vitest';

import { ConfigGameUI } from '../../config/ConfigGameUI';

import { mockConfigGameUI } from '../testing';

const board = document.createElement('div');

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI();
});

describe('ConfigGameUI', () => {
	test('board', () => {
		new ConfigGameUI(board);
	});
});
