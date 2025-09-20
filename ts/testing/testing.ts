// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { EngineColor } from '../engine/GameEngine';

import { newGameDeps } from '../game/GameDeps';
import { GameDeps    } from '../game/GameDeps';
import { GameState   } from '../game/GameState';

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

const boardUI = document.createElement('div');
boardUI.id = 'testing-chessboard';

export class TestGameState implements GameState {
	public reset(): void {
		return;
	}

	public save(): void {
		return;
	}

	public async load(): Promise<boolean> {
		return false;
	}

	public async setupNewGame(): Promise<boolean> {
		return false;
	}

	public getOrientation(): EngineColor {
		return 'w';
	}

	public toggleOrientation(): void {
		return;
	}

	public gameDescription(): string {
		return 't15+10';
	}
}

export function mockGameDeps(): GameDeps {
	const deps = newGameDeps(boardUI);
	deps.state = new TestGameState();
	return deps;
}
