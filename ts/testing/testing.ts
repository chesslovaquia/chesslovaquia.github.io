// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export function mockConfigGameUI(): string {
	return `
	<div id="clvqInternalError">
		<div id="clvqInternalErrorMessage"></div>
	</div>

	<div id="chessboard"></div>

	<div id="gamePlayer1"></div>
	<div id="gameClock1"></div>
	<div id="gameMaterial1"></div>
	<div id="gameMaterialCount1"></div>

	<div id="gamePlayer2"></div>
	<div id="gameClock2"></div>
	<div id="gameMaterial2"></div>
	<div id="gameMaterialCount2"></div>

	<div id="gameDescription"></div>
	<div id="gameStatus"></div>
	<div id="gameOutcome"></div>

	<a id="gameReset"></a>

	<button id="gameNavBackward"></button>
	<button id="gameNavForward"></button>
	<button id="gameFlipBoard"></button>
	<button id="gameNavFirstMove"></button>
	<button id="gameNavLastMove"></button>
	`;
}
