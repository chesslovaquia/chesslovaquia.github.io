// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Key } from 'chessground/types'

interface ChessGameData {
	fen:      string
	lastMove: Key[]
}

export { ChessGameData }
