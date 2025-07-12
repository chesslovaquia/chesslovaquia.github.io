import { ChessGame }       from './ChessGame'
import { ChessGameConfig } from './ChessGameConfig'
import { ChessGameError }  from './ChessGameError'

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const boardElement = document.getElementById('chessboard')
	if (boardElement) {
		const cfg = new ChessGameConfig(boardElement)
		new ChessGame(cfg)
	} else {
		throw new ChessGameError('board not found!')
	}
})
