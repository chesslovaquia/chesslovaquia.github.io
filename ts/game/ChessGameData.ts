// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Key } from 'chessground/types'

interface ChessGameDataMove {
	from:        string
	to:          string
	isPromotion: boolean
	san:         string
}

interface ChessGameData {
	fen:      string
	curMove:  ChessGameDataMove
	prevMove: ChessGameDataMove
}

export {
	ChessGameData,
	ChessGameDataMove,
}
