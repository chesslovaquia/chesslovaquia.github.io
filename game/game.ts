import { ChessGame } from './lib/ChessGame.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const boardElement = document.getElementById('chessboard');
	const statusElement = document.getElementById('status');
	const resetButton = document.getElementById('reset');

	if (boardElement) {
		const game = new ChessGame({
			boardElement,
			statusElement: statusElement || undefined,
			resetButton: resetButton || undefined
		});
		//~ game.pawnPromotionShow('white');
		(window as any).Clvq.Game = game;
	}
});
