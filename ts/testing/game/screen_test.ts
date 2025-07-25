// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import 'whatwg-fetch';

import { __screen } from '../../game/screen';

__screen.sleep = jest.fn();

describe('screen', () => {
	test('load', async () => {
		await __screen.screenLoad(300);
	});
});
