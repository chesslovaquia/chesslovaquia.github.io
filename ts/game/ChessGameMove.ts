import { Api as ChessgroundApi } from 'chessground/api'

import * as board from 'chessground/types'
import * as game  from 'chess.js'

import { ChessGameState } from './ChessGameState'

class ChessGameMove {
	private readonly game:  game.Chess
	private readonly board: ChessgroundApi
	private readonly state: ChessGameState

	public curMove:  game.Move | null
	public prevMove: game.Move | null

	constructor(g: game.Chess, b: ChessgroundApi, s: ChessGameState) {
		this.game     = g
		this.board    = b
		this.state    = s
		this.curMove  = null
		this.prevMove = null
		this.setupBoard()
	}

	private setupBoard(): void {
		this.board.set({
			turnColor: this.turnColor(),
			movable: {
				color: this.turnColor(),
				dests: this.possibleDests(),
				showDests: true,
			},
		})
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

	public exec(orig: board.Key, dest: board.Key, promotion: string): void {
		try {
			if (this.curMove) {
				this.prevMove = null
				this.prevMove = this.curMove
			}
			this.curMove = null
			const move = this.game.move({
				from: orig as game.Square,
				to: dest as game.Square,
				promotion: promotion,
			})
			if (move) {
				this.board.set({
					fen: this.game.fen(),
					turnColor: this.turnColor(),
					movable: {
						color: this.turnColor(),
						dests: this.possibleDests()
					},
					lastMove: [orig, dest],
				})
				this.curMove = move
				this.state.push(this.game.fen())
			} else {
				// Invalid move - reset position
				this.board.set({ fen: this.game.fen() })
			}
		} catch (error) {
			console.error('Invalid move:', error)
			// Reset board to current position
			this.board.set({ fen: this.game.fen() })
		}
	}

	public undo(): boolean {
		let lastMove: board.Key[] = []
		if (this.prevMove) {
			lastMove[0] = this.prevMove.from
			lastMove[1] = this.prevMove.to
		}
		if (this.game.undo()) {
			this.board.set({
				fen: this.game.fen(),
				turnColor: this.turnColor(),
				movable: {
					color: this.turnColor(),
					dests: this.possibleDests(),
				},
				lastMove: lastMove,
			})
			return true
		}
		console.log('No move to undo!')
		return false
	}
}

export { ChessGameMove }
