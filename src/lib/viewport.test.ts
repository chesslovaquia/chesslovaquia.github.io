// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { initViewportHeight } from './viewport';

function setInnerHeight(height: number): void {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
}

describe('initViewportHeight', () => {
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    setInnerHeight(originalInnerHeight);
    document.documentElement.style.removeProperty('--clvq-vh');
    vi.restoreAllMocks();
  });

  it('sets --clvq-vh from the current window height', () => {
    setInnerHeight(640);
    initViewportHeight();
    expect(document.documentElement.style.getPropertyValue('--clvq-vh')).toBe('640px');
  });

  it('updates --clvq-vh on resize', () => {
    setInnerHeight(640);
    initViewportHeight();
    setInnerHeight(480);
    window.dispatchEvent(new Event('resize'));
    expect(document.documentElement.style.getPropertyValue('--clvq-vh')).toBe('480px');
  });

  it('updates --clvq-vh on orientationchange', () => {
    setInnerHeight(480);
    initViewportHeight();
    setInnerHeight(800);
    window.dispatchEvent(new Event('orientationchange'));
    expect(document.documentElement.style.getPropertyValue('--clvq-vh')).toBe('800px');
  });
});
