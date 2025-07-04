import { ChessGame } from './ChessGame';
import { ChessGameError } from './types';

class ChessGameAction {
	private readonly game: ChessGame;

	public init(): void {
		console.log('Game init.');
		if (this.game) {
			throw new ChessGameError('Game ERROR: already initialized.');
		}
		const boardElement = document.getElementById('chessboard');
		if (boardElement) {
			this.game = new ChessGame({
				boardElement,
				statusElement: document.getElementById('status') || undefined,
				resetButton: document.getElementById('reset') || undefined
			});
		} else {
			console.log('Game init ERROR: board element not found.');
		}
	}

	// Pawn Promotion

	public pawnPromotionHide(side: string): void {
		document.getElementById(`${side}PawnPromotion`).style.display='none';
	}

	public pawnPromotionShow(side: string): void {
		document.getElementById(`${side}PawnPromotion`).style.display='block';
	}

	public pawnPromotion(side: string, piece: string): void {
		console.log('Pawn promotion:', side, piece);
		this.pawnPromotionHide(side);
	}
}

export { ChessGameAction };
