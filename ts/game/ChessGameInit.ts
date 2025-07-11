import { ChessGame } from './ChessGame';
import { ChessGameError } from './types';

class ChessGameInit {
	private game: ChessGame | null = null;

	public initDone: boolean = false;

	public init(): void {
		console.log('Game init.');
		if (this.initDone) {
			throw new ChessGameError('Game ERROR: already initialized.');
		}
		const boardElement = document.getElementById('chessboard');
		if (boardElement) {
			this.game = new ChessGame({
				boardElement: (boardElement as HTMLElement),
				statusElement: document.getElementById('gameStatus') || undefined,
				resetButton: document.getElementById('gameReset') || undefined,
				undoButton: document.getElementById('gameUndo') || undefined,
				redoButton: document.getElementById('gameRedo') || undefined,
			});
			this.initDone = true;
		}
	}
}

export { ChessGameInit };
