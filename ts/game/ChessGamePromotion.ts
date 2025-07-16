// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import * as board from 'chessground/types'

import { ChessGameDisplay } from './ChessGameDisplay'
import { ChessGameMove    } from './ChessGameMove'

class ChessGamePromotion {
	private readonly move:    ChessGameMove
	private readonly display: ChessGameDisplay

	constructor(m: ChessGameMove, d: ChessGameDisplay) {
		this.move    = m
		this.display = d
	}

	public handle(orig: board.Key, dest: board.Key): void {
		console.log('Pawn promotion handle:', orig, dest)
		this.move.undo()
		const side: board.Color = this.move.turnColor()
		this.showModal(side, (selectedPiece) => {
			this.exec(orig, dest, side, selectedPiece)
		})
	}

	private exec(orig: board.Key, dest: board.Key, side: board.Color, piece: board.Role): void {
		console.log('Pawn promotion exec:', orig, dest, side, piece)
		this.move.exec(orig, dest, piece)
		this.finish(orig, dest, side, piece)
	}

	private showModal(side: board.Color, callback: any): void {
		console.log('Pawn promotion show modal:', side)
		const modal = document.getElementById(`${side}PawnPromotion`)
		if (modal) {
			modal.style.display='block'
			modal.addEventListener('click', (evt: MouseEvent) => {
				console.log('Pawn promotion select:', evt.target)
				if (evt.target) {
					const elem = (evt.target as HTMLElement)
					if (elem.classList.contains('clvq-promotion-piece')) {
						const piece = elem.dataset.piece
						callback(piece)
						modal.style.display='none'
					}
				}
			})
		} else {
			console.log('Pawn promotion ERROR:', side, 'modal not found.')
		}
	}

	private finish(orig: board.Key, dest: board.Key, side: board.Color, piece: string): void {
		console.log('Pawn promotion done:', orig, dest, side, piece)
		this.display.updateStatus()
	}
}

export { ChessGamePromotion }
