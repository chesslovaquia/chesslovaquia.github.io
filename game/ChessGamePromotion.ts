import { Api as ChessgroundApi } from 'chessground/api';
import { Key, Role, Piece } from 'chessground/types';

class ChessGamePromotion {
	private readonly board: ChessgroundApi;

	constructor(board: ChessgroundApi) {
		this.board = board;
	}

	public check(orig: Key, dest: Key): boolean {
		const piece = this.board.state.pieces.get(dest);
		if (!piece || piece.role !== 'pawn') {
			return false;
		}
		const promRank = piece.color === 'white' ? '8' : '1';
		return dest[1] === promRank;
	}

	public handle(orig: Key, dest: Key): void {
		const piece: Piece = (this.board.state.pieces.get(dest) as Piece);
		// store current state
		const curPieces = new Map(this.board.state.pieces);
		curPieces.delete(dest);
		curPieces.set(orig, piece);

		// revert move temporarily
		//~ this.board.set({pieces: curPieces});

		// show promotion modal
		this.showModal(piece.color, (selectedPiece) => {
			this.exec(orig, dest, piece.color, selectedPiece);
		});
	}

	private showModal(side: string, callback: any): void {
		const modal = document.getElementById(`${side}PawnPromotion`);
		if (modal) {
			modal.addEventListener('click', (elem: HTMLElement) => {
				if (elem.target.classList.contains('clvq-promotion-piece')) {
					const piece = elem.target.dataset.piece;
					callback(piece);
					modal.style.display='none';
				}
			});
		} else {
			console.log('Pawn promotion ERROR:', side, 'modal not found.');
		}
	}

	private exec(orig: Key, dest: Key, side: string, piece: Role): void {
		const newPieces = new Map(this.board.state.pieces);
		newPieces.delete(orig);
		newPieces.set(dest, {
			color: side,
			role: piece,
		});
		this.board.set({
			pieces: newPieces,
			lastMove: [orig, dest],
		});
		this.finish(orig, dest, side, piece);
	}

	private finish(orig: Key, dest: Key, side: string, piece: string): void {
		console.log('Pawn promotion done:', orig, dest, side, piece);
	}
}

export { ChessGamePromotion };
