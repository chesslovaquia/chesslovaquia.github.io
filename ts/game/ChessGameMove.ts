import { Api as ChessgroundApi } from 'chessground/api'
import { Chess } from 'chess.js'

class ChessGameMove {
	private game: Chess
	private board: ChessgroundApi

	constructor(game: Chess, board: ChessgroundApi) {
		this.game = game
		this.board = board
	}
}

export { ChessGameMove }
