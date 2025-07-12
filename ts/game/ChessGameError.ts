class ChessGameError extends Error {
	constructor(msg) {
		super(`Game ERROR: ${msg}`)
	}
}
export { ChessGameError }
