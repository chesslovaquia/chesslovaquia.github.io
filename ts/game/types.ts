class ChessGameError extends Error {
	constructor(msg) {
		super(msg);
	}
}

interface ChessGameConfig {
	boardElement: HTMLElement;
	statusElement?: HTMLElement;
	resetButton?: HTMLElement;
	undoButton?: HTMLElement;
	redoButton?: HTMLElement;
}

export {
	ChessGameError,
	ChessGameConfig,
};
