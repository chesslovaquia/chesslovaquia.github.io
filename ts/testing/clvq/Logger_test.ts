// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, vi, afterEach } from 'vitest';

import { Logger } from '../../clvq/Logger';

describe('Logger', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('debug()', () => {
		it('suppresses output when disabled (default)', () => {
			const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
			const log = new Logger();
			log.debug('hello');
			expect(spy).not.toHaveBeenCalled();
		});

		it('calls console.debug when enabled', () => {
			const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
			const log = new Logger(true);
			log.debug('hello');
			expect(spy).toHaveBeenCalledWith('hello');
		});

		it('forwards multiple args when enabled', () => {
			const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
			const log = new Logger(true);
			log.debug('a', 'b', 42);
			expect(spy).toHaveBeenCalledWith('a', 'b', 42);
		});
	});

	describe('warn()', () => {
		it('always calls console.warn', () => {
			const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const log = new Logger();
			log.warn('oops');
			expect(spy).toHaveBeenCalledWith('oops');
		});

		it('forwards multiple args', () => {
			const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const log = new Logger();
			log.warn('x', 'y');
			expect(spy).toHaveBeenCalledWith('x', 'y');
		});
	});

	describe('error()', () => {
		it('always calls console.error', () => {
			const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const log = new Logger();
			log.error('fail');
			expect(spy).toHaveBeenCalledWith('fail');
		});

		it('forwards multiple args', () => {
			const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
			const log = new Logger();
			const err = new Error('boom');
			log.error('context:', err);
			expect(spy).toHaveBeenCalledWith('context:', err);
		});
	});
});
