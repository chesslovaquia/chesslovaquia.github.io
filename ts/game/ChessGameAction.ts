import { ChessGame } from './ChessGame';
import { ChessGameError } from './types';

class ChessGameAction {
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
				statusElement: document.getElementById('status') || undefined,
				resetButton: document.getElementById('reset') || undefined
			});
			this.initDone = true;
		}
	}
}

export { ChessGameAction };
