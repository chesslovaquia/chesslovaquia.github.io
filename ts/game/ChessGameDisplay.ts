import { Chess, Move } from 'chess.js'

import { ChessGameConfig } from './ChessGameConfig'

class ChessGameDisplay {
	private readonly game: Chess

	private statusElement: HTMLElement | undefined

	constructor(game: Chess, config: ChessGameConfig) {
		this.game = game
		this.statusElement = config.statusElement
	}

	public status(move: Move | null): void {
		if (!this.statusElement) {
			return
		}
		let statusText = ''
		if (this.game.isGameOver()) {
			if (this.game.isCheckmate()) {
				const winner = this.game.turn() === 'w' ? 'Black' : 'White'
				statusText = `Checkmate! ${winner} wins.`
			} else if (this.game.isDraw()) {
				statusText = 'Draw!'
			} else if (this.game.isStalemate()) {
				statusText = 'Stalemate!'
			} else if (this.game.isThreefoldRepetition()) {
				statusText = 'Draw by threefold repetition!'
			} else if (this.game.isInsufficientMaterial()) {
				statusText = 'Draw by insufficient material!'
			}
		} else {
			const currentPlayer = this.game.turn() === 'w' ? 'White' : 'Black'
			statusText = `${currentPlayer} to move`
			if (this.game.inCheck()) {
				statusText += ' (in check)'
			} else if (move) {
				if (move.isPromotion()) {
					statusText += ' (pawn promotion)'
				}
			}
		}
		this.statusElement.textContent = statusText
	}
}

export { ChessGameDisplay }
