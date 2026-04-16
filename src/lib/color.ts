// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

/** Convert chess.js color ('w' | 'b') to chessground color ('white' | 'black'). */
export function cgColor(side: 'w' | 'b'): 'white' | 'black' {
  return side === 'w' ? 'white' : 'black';
}

/** Convert chessground color ('white' | 'black') to chess.js color ('w' | 'b'). */
export function chessJsColor(side: 'white' | 'black'): 'w' | 'b' {
  return side === 'white' ? 'w' : 'b';
}
