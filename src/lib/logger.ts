// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LS_DEBUG } from './config';

class Logger {
  private get debugEnabled(): boolean {
    try {
      return localStorage.getItem(LS_DEBUG) === '1';
    } catch {
      return false;
    }
  }

  debug(...args: unknown[]): void {
    if (this.debugEnabled) console.debug('[clvq]', ...args);
  }

  warn(...args: unknown[]): void {
    console.warn('[clvq]', ...args);
  }

  error(...args: unknown[]): void {
    console.error('[clvq]', ...args);
  }
}

export const logger = new Logger();
