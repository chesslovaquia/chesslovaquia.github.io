// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect } from 'vitest';
import { cgColor, chessJsColor } from './color';

describe('cgColor', () => {
  it('maps w to white', () => {
    expect(cgColor('w')).toBe('white');
  });

  it('maps b to black', () => {
    expect(cgColor('b')).toBe('black');
  });
});

describe('chessJsColor', () => {
  it('maps white to w', () => {
    expect(chessJsColor('white')).toBe('w');
  });

  it('maps black to b', () => {
    expect(chessJsColor('black')).toBe('b');
  });

  it('round-trips', () => {
    expect(chessJsColor(cgColor('w'))).toBe('w');
    expect(chessJsColor(cgColor('b'))).toBe('b');
    expect(cgColor(chessJsColor('white'))).toBe('white');
    expect(cgColor(chessJsColor('black'))).toBe('black');
  });
});
