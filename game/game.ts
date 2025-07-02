import { ChessGame } from './lib/ChessGame.js';

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const boardElement = document.getElementById('chessboard');
	const statusElement = document.getElementById('status');
	const resetButton = document.getElementById('reset');

	if (boardElement) {
		const chessGame = new ChessGame({
			boardElement,
			statusElement: statusElement || undefined,
			resetButton: resetButton || undefined
		});

		// Make the chess game instance globally available for debugging
		(window as any).chessGame = chessGame;
	}
});
