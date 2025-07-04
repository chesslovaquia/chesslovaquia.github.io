class ChessGameError extends Error {
	constructor(msg) {
		super(msg);
	}
}

interface ChessGameConfig {
	boardElement: HTMLElement;
	statusElement?: HTMLElement;
	resetButton?: HTMLElement;
}

export {
	ChessGameError,
	ChessGameConfig,
};
