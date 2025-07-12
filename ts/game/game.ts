import { ChessGame } from './ChessGame'
import { ChessGameError } from './types'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const boardElement = document.getElementById('chessboard')
	if (boardElement) {
		new ChessGame({
			boardElement: (boardElement as HTMLElement),
			statusElement: document.getElementById('gameStatus') || undefined,
			resetButton: document.getElementById('gameReset') || undefined,
			undoButton: document.getElementById('gameUndo') || undefined,
			redoButton: document.getElementById('gameRedo') || undefined,
		})
	} else {
		throw new ChessGameError('board not found!')
	}
})
