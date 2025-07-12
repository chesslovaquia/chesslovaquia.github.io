class ChessGameError extends Error {
	constructor(msg) {
		super(`Game ERROR: ${msg}`)
	}
}

interface ChessGameConfig {
	boardElement: HTMLElement
	statusElement?: HTMLElement
	resetButton?: HTMLElement
	undoButton?: HTMLElement
	redoButton?: HTMLElement
}

export {
	ChessGameError,
	ChessGameConfig,
}
