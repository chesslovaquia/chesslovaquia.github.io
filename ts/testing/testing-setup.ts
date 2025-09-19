// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi } from 'vitest';

const mockIndexedDB = {
	open: vi.fn(),
};

vi.stubGlobal('indexedDB', mockIndexedDB);
