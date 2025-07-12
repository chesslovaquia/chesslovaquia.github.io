import { Chessground }           from 'chessground'
import { Api as ChessgroundApi } from 'chessground/api'

import * as board from 'chessground/types'
import * as game  from 'chess.js'

import { ChessGameConfig }    from './ChessGameConfig'
import { ChessGameDisplay }   from './ChessGameDisplay'
import { ChessGameError }     from './ChessGameError'
import { ChessGameMove }      from './ChessGameMove'
import { ChessGamePromotion } from './ChessGamePromotion'
import { ChessGameState }     from './ChessGameState'

class ChessGame {
	private readonly game: game.Chess
	private readonly board: ChessgroundApi
	private readonly move: ChessGameMove
	private readonly promotion: ChessGamePromotion
	private readonly state: ChessGameState
	private readonly display: ChessGameDisplay

	constructor(config: ChessGameConfig) {
		console.log('Game board.')
		this.board     = this.newBoard(config)
		this.game      = this.newGame()
		this.state     = new ChessGameState(this.game.fen())
		this.move      = new ChessGameMove(this.game, this.board, this.state)
		this.display   = new ChessGameDisplay(config, this.game, this.move)
		this.promotion = new ChessGamePromotion(this.move)
		if (this.board) {
			this.setupEventListeners(config)
			this.display.updateStatus()
		}
	}

	private setupEventListeners(cfg: ChessGameConfig): void {
		if (cfg.resetButton) {
			cfg.resetButton.addEventListener('click', () => this.reset())
		}
		if (cfg.undoButton) {
			cfg.undoButton.addEventListener('click', () => this.undo())
		}
		if (cfg.redoButton) {
			cfg.redoButton.addEventListener('click', () => this.redo())
		}
	}

	private newGame(): game.Chess {
		return new game.Chess(game.DEFAULT_POSITION)
	}

	private newBoard(config: ChessGameConfig): ChessgroundApi {
		if (!config.boardElement) {
			throw new ChessGameError('Init board element not found.')
		}
		return Chessground(config.boardElement, {
			disableContextMenu: true,
			coordinates: false,
			fen: this.game.fen(),
			orientation: 'white',
			turnColor: this.move.turnColor(),
			movable: {
				color: this.move.turnColor(),
				free: false,
				dests: this.move.possibleDests(),
				showDests: true,
				rookCastle: true,
				events: {
					after: (orig: board.Key, dest: board.Key, meta?: board.MoveMetadata) => {
						this.afterMove(orig, dest)
					},
				},
			},
			events: {
				move: (orig: board.Key, dest: board.Key, gotPiece?: board.Piece) => {
					this.onMove(orig, dest, gotPiece)
				},
			},
			highlight: {
				lastMove: true,
				check: true,
			},
			selectable: {
				enabled: true,
			},
			premovable: {
				enabled: false,
			},
			animation: {
				enabled: false,
				duration: 200,
			},
			drawable: {
				enabled: false,
			},
			draggable: {
				enabled: false,
			},
		})
	}

	private onMove(orig: board.Key, dest: board.Key, gotPiece?: board.Piece): void {
		this.move.exec(orig, dest, 'q')
		this.display.updateStatus()
	}

	private afterMove(orig: board.Key, dest: board.Key) {
		console.log('Game move was:', orig, dest)
		if (!this.move.curMove) {
			return
		}
		// Pawn promotion.
		if (this.move.curMove.isPromotion()) {
			console.log('Game move was pawn promotion.')
			this.promotion.handle(orig, dest)
			this.display.updateStatus()
		}
	}

	public reset(): void {
		console.log('Game reset!')
		this.game.reset()
		this.board.set({
			fen: this.game.fen(),
			turnColor: this.move.turnColor(),
			movable: {
				color: this.move.turnColor(),
				dests: this.move.possibleDests(),
			},
			lastMove: [],
		})
		this.display.updateStatus()
	}

	private undo(): void {
		console.log('Move undo.')
		if (this.move.undo()) {
			this.display.updateStatus()
		}
	}

	private redo(): void {
		console.log('Move redo.')
		if (this.move.redo()) {
			this.display.updateStatus()
		}
	}

}

export { ChessGame }
