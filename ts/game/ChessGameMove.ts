import * as board from 'chessground/types'
import * as game  from 'chess.js'

class ChessGameMove {
	private readonly game: game.Chess

	constructor(g: game.Chess) {
		this.game = g
	}

	public possibleDests(): Map<board.Key, board.Key[]> {
		const dests = new Map<board.Key, board.Key[]>()
		game.SQUARES.forEach((square: game.Square) => {
			const moves = this.game.moves({ square, verbose: true }) as game.Move[]
			if (moves.length > 0) {
				dests.set(square as board.Key, moves.map((move: game.Move) => move.to as board.Key))
			}
		})
		return dests
	}

	public turnColor(): board.Color {
		return this.game.turn() === 'w' ? 'white' : 'black'
	}
}

export { ChessGameMove }
