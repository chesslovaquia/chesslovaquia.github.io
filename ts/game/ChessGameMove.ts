// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Api as ChessgroundApi } from 'chessground/api'

import * as board from 'chessground/types'
import * as game  from 'chess.js'

import { ChessGameDataMove } from './ChessGameData'
import { ChessGameState }    from './ChessGameState'

class ChessGameMove {
	private readonly game:  game.Chess
	private readonly board: ChessgroundApi
	private readonly state: ChessGameState

	public readonly curMove:  ChessGameDataMove
	public readonly prevMove: ChessGameDataMove

	constructor(g: game.Chess, b: ChessgroundApi, s: ChessGameState) {
		this.game     = g
		this.board    = b
		this.state    = s
		this.curMove  = this.newMoveData()
		this.prevMove = this.newMoveData()
		this.setupBoard()
	}

	private newMoveData(): ChessGameDataMove {
		return {from: "", to: "", isPromotion: false, san: ""}
	}

	private setPrevMove(): void {
		this.prevMove.from        = this.curMove.from
		this.prevMove.to          = this.curMove.to
		this.prevMove.isPromotion = this.curMove.isPromotion
		this.prevMove.san         = this.curMove.san
	}

	private setCurMove(move: game.Move): void {
		this.curMove.from        = move.from
		this.curMove.to          = move.to
		this.curMove.isPromotion = move.isPromotion()
		this.curMove.san         = move.san
	}

	private undoCurMove(): void {
		this.curMove.from        = this.prevMove.from
		this.curMove.to          = this.prevMove.to
		this.curMove.isPromotion = this.prevMove.isPromotion
		this.curMove.san         = this.prevMove.san
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
			this.setPrevMove()
			const move = this.game.move({
				from: orig as game.Square,
				to: dest as game.Square,
				promotion: promotion,
			})
			if (move) {
				console.log('Move:', move.san)
				this.board.set({
					fen: this.game.fen(),
					turnColor: this.turnColor(),
					movable: {
						color: this.turnColor(),
						dests: this.possibleDests()
					},
					lastMove: [orig, dest],
				})
				this.setCurMove(move)
				this.state.push(this.game.fen(), this.curMove, this.prevMove)
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
		if (this.curMove.san !== "") {
			console.log('Move undo:', this.curMove.san)
		}
		if (this.game.undo()) {
			let lastMove: board.Key[] = []
			if (this.prevMove.san !== "") {
				console.log('Move previous:', this.prevMove.san)
				lastMove = [(this.prevMove.from as board.Key), (this.prevMove.to as board.Key)]
			}
			this.undoCurMove()
			this.state.pop()
			this.board.set({
				fen: this.game.fen(),
				turnColor: this.turnColor(),
				movable: {
					color: this.turnColor(),
					dests: this.possibleDests(),
				},
				lastMove: lastMove,
			})
			if (this.curMove.san !== "") {
				console.log('Move back to:', this.curMove.san)
			}
			return true
		}
		console.log('No move to undo!')
		return false
	}
}

export { ChessGameMove }
