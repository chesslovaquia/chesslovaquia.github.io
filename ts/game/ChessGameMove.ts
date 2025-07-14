// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { Api as ChessgroundApi } from 'chessground/api'

import * as board from 'chessground/types'
import * as game  from 'chess.js'

import { ChessGameState }    from './ChessGameState'

class ChessGameMove {
	private readonly game:  game.Chess
	private readonly board: ChessgroundApi
	private readonly state: ChessGameState

	private curMove:  game.Move | null
	private prevMove: game.Move | null

	constructor(g: game.Chess, b: ChessgroundApi, s: ChessGameState) {
		this.game     = g
		this.board    = b
		this.state    = s
		this.curMove  = null
		this.prevMove = null
		this.setupBoard()
	}

	private setPrevMove(): void {
		this.prevMove = null
		this.prevMove = this.curMove
	}

	private setCurMove(move: game.Move): void {
		this.setPrevMove()
		this.curMove = null
		this.curMove = move
	}

	private undoCurMove(): void {
		this.curMove = null
		this.curMove = this.prevMove
		this.prevMove = null
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

	private saveState(): void {
		this.state.saveMoves(this.game.history())
	}

	public updateBoard(lastMove: board.Key[]): void {
		this.board.set({
			fen: this.game.fen(),
			turnColor: this.turnColor(),
			movable: {
				color: this.turnColor(),
				dests: this.possibleDests()
			},
			lastMove: lastMove,
		})
		this.saveState()
	}

	public isPromotion(): boolean {
		if (this.curMove) {
			if (this.game.turn() === this.curMove.color) {
				return this.curMove.isPromotion()
			}
		}
		return false
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
			const move = this.game.move({
				from: orig as game.Square,
				to: dest as game.Square,
				promotion: promotion,
			})
			if (move) {
				console.log('Move:', move.san)
				this.setCurMove(move)
				this.updateBoard([orig, dest])
			} else {
				// Invalid move - reset position
				console.error('Invalid move, reset position:', move)
				this.board.set({ fen: this.game.fen() })
			}
		} catch (error) {
			console.error('Invalid move:', error)
			// Reset board to current position
			this.board.set({ fen: this.game.fen() })
		}
	}

	public undo(): boolean {
		if (this.curMove) {
			console.log('Move undo:', this.curMove.san)
		}
		if (this.game.undo()) {
			let lastMove: board.Key[] = []
			if (this.prevMove) {
				console.log('Move previous:', this.prevMove.san)
				lastMove = [(this.prevMove.from as board.Key), (this.prevMove.to as board.Key)]
			}
			this.undoCurMove()
			if (this.curMove) {
				console.log('Move back to:', this.curMove.san)
			}
			this.updateBoard(lastMove)
			return true
		}
		console.log('No move to undo!')
		return false
	}

	public reset(): void {
		this.prevMove = null
		this.curMove  = null
	}

	public getLastMove(): board.Key[] {
		if (this.curMove) {
			return [this.curMove.from, this.curMove.from]
		}
		return []
	}

	public loadMoves(curMove: game.Move | null, prevMove: game.Move | null): void {
		this.reset()
		this.prevMove = prevMove
		this.curMove = curMove
		this.updateBoard(this.getLastMove())
	}
}

export { ChessGameMove }
