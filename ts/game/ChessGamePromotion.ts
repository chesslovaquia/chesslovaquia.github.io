import { Api as ChessgroundApi } from 'chessground/api';
import {
	Color,
	Key,
	Piece,
	Role,
} from 'chessground/types';

class ChessGamePromotion {
	private readonly board: ChessgroundApi;

	constructor(board: ChessgroundApi) {
		this.board = board;
	}

	public check(dest: Key): boolean {
		const piece = this.board.state.pieces.get(dest);
		console.log('Pawn promotion check:', dest, piece);
		if (!piece || piece.role !== 'queen') {
			return false;
		}
		const promRank = piece.color === 'white' ? '8' : '1';
		return dest[1] === promRank;
	}

	public showModal(side: Color, callback: any): void {
		const modal = document.getElementById(`${side}PawnPromotion`);
		if (modal) {
			modal.style.display='block';
			modal.addEventListener('click', (evt: MouseEvent) => {
				console.log('Pawn promotion select:', evt.target);
				if (evt.target) {
					const elem = (evt.target as HTMLElement);
					if (elem.classList.contains('clvq-promotion-piece')) {
						const piece = elem.dataset.piece;
						callback(piece);
						modal.style.display='none';
					}
				}
			});
		} else {
			console.log('Pawn promotion ERROR:', side, 'modal not found.');
		}
	}

	public finish(orig: Key, dest: Key, side: Color, piece: string): void {
		console.log('Pawn promotion done:', orig, dest, side, piece);
	}
}

export { ChessGamePromotion };
