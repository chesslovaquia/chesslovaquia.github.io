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

	private loadGame(): void {
		if (this.state.hasGame()) {
			const g = this.state.getGame()
			console.log('Game load from saved state:', g)
			this.game.reset()
			this.game.load(g.fen)
			this.board.set({
				fen: this.game.fen(),
				turnColor: this.move.turnColor(),
				movable: {
					color: this.move.turnColor(),
					dests: this.move.possibleDests(),
				},
				lastMove: [(g.curMove.from as board.Key), (g.curMove.to as board.Key)],
			})
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
		if (this.move.curMove.isPromotion) {
			console.log('Move was pawn promotion.')
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
		this.state.reset()
		this.display.updateStatus()
	}
}

export { ChessGame }
