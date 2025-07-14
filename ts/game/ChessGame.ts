// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

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
	private readonly game:      game.Chess
	private readonly board:     ChessgroundApi
	private readonly move:      ChessGameMove
	private readonly promotion: ChessGamePromotion
	private readonly state:     ChessGameState
	private readonly display:   ChessGameDisplay

	constructor(config: ChessGameConfig) {
		console.log('Game board.')
		// Respect the order.
		this.game      = this.newGame()
		this.board     = this.newBoard(config)
		this.state     = new ChessGameState()
		this.move      = new ChessGameMove(this.game, this.board, this.state)
		this.display   = new ChessGameDisplay(config, this.game, this.move)
		this.promotion = new ChessGamePromotion(this.move)
		if (this.board) {
			this.setupEventListeners(config)
			this.loadGame()
			this.display.updateStatus()
		}
	}

	private setupEventListeners(cfg: ChessGameConfig): void {
		if (cfg.resetButton) {
			cfg.resetButton.addEventListener('click', () => this.reset())
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
			turnColor: 'white',
			movable: {
				color: 'white',
				free: false,
				showDests: false,
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
		// Pawn promotion.
		if (this.move.isPromotion()) {
			console.log('Move was pawn promotion.')
			this.promotion.handle(orig, dest)
			this.display.updateStatus()
		}
	}

	private reset(): void {
		console.log('Game reset!')
		this.game.reset()
		this.move.updateBoard([])
		this.state.reset()
		this.display.updateStatus()
	}

	private loadGame(): void {
		const moves = this.state.getMoves()
		if (moves) {
			console.debug('Game load from saved moves:', moves)
			this.game.reset()
			this.move.reset()
			this.state.reset()
			try {
				this.loadMoves(moves)
			} catch(err) {
				console.error('Game moves load failed:', err)
				this.game.reset()
				this.move.reset()
				this.state.reset()
				this.move.updateBoard(this.move.getLastMove())
			}
		} else {
			console.info('No saved pgn to load.')
		}
		this.display.updateStatus()
	}

	private loadMoves(moves: string[]): void {
		let prevMove: game.Move | null = null
		let curMove: game.Move | null = null
		let gotError = ''
		moves.every(san => {
			console.debug('Load move:', san)
			prevMove = null
			prevMove = curMove
			curMove = null
			curMove = this.game.move(san, { strict: true })
			if (curMove) {
				return true
			} else {
				gotError = san
				return false
			}
		})
		if (gotError !== '') {
			throw new ChessGameError(`Invalid move: ${gotError}`)
		} else {
			this.move.loadMoves(curMove, prevMove)
		}
	}
}

export { ChessGame }
