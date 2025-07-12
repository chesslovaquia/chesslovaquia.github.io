import { Api as ChessgroundApi } from 'chessground/api'
import * as board from 'chessground/types'

class ChessGamePromotion {
	private readonly board: ChessgroundApi

	constructor(b: ChessgroundApi) {
		this.board = b
	}

	public showModal(side: board.Color, callback: any): void {
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

	public finish(orig: board.Key, dest: board.Key, side: board.Color, piece: string): void {
		console.log('Pawn promotion done:', orig, dest, side, piece)
	}
}

export { ChessGamePromotion }
