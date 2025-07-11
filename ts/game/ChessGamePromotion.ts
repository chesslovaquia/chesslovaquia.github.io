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

	public handle(orig: Key, dest: Key): void {
		console.log('Pawn promotion handle:', orig, dest);
		const piece: Piece = (this.board.state.pieces.get(dest) as Piece);
		this.board.state.pieces.delete(dest);
		console.log('Pawn promotion show modal:', piece.color);
		this.showModal(piece.color, (selectedPiece) => {
			this.exec(orig, dest, piece.color, selectedPiece);
		});
	}

	private showModal(side: Color, callback: any): void {
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

	private exec(orig: Key, dest: Key, side: Color, piece: Role): void {
		this.board.state.pieces.delete(orig);
		this.board.state.pieces.set(dest, {
			color: side,
			role: piece,
		});
		this.board.set({
			lastMove: [orig, dest],
		});
		this.finish(orig, dest, side, piece);
	}

	private finish(orig: Key, dest: Key, side: Color, piece: string): void {
		console.log('Pawn promotion done:', orig, dest, side, piece);
	}
}

export { ChessGamePromotion };
