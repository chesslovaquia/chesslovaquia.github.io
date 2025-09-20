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

export class TestGameConfig {
	public readonly boardUI: HTMLElement;

	public stateLoad: boolean = false;
	public stateSetupNewGame: boolean = false;
	public stateOrientation: EngineColor = 'w';

	constructor() {
		this.boardUI = document.createElement('div');
		this.boardUI.id = 'testing-chessboard';
	}
}

export class TestGameState implements GameState {

	private readonly cfg: TestGameConfig;

	constructor(cfg: TestGameConfig) {
		this.cfg = cfg;
	}

	public reset(): void {
		return;
	}

	public save(): void {
		return;
	}

	public async load(): Promise<boolean> {
		return this.cfg.stateLoad;
	}

	public async setupNewGame(): Promise<boolean> {
		return this.cfg.stateSetupNewGame;
	}

	public getOrientation(): EngineColor {
		return this.cfg.stateOrientation;
	}

	public toggleOrientation(): void {
		return;
	}

	public gameDescription(): string {
		return 't15+10';
	}
}

export function mockGameDeps(cfg: TestGameConfig): GameDeps {
	const deps = newGameDeps(cfg.boardUI);
	deps.state = new TestGameState(cfg);
	return deps;
}
