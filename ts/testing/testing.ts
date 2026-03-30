// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi } from 'vitest';

import { EngineColor } from '../engine/GameEngine';

import { newGameDeps } from '../game/GameDeps';
import { GameDeps    } from '../game/GameDeps';
import { GameState   } from '../game/GameState';

import { LichessAuth   } from '../lichess/LichessAuth';
import { LichessClient } from '../lichess/LichessClient';
import { LichessGame   } from '../lichess/LichessGame';
import type { LichessChallenge, LichessGameFull } from '../lichess/LichessGame';

export function mockConfigGameUI(): string {
	return `
	<div id="clvqInternalError">
		<div id="clvqInternalErrorMessage"></div>
	</div>

	<div id="chessboard"></div>

	<div id="gamePlayer1"></div>
	<div id="gamePlayerRating1" style="display:none"></div>
	<div id="gameClock1"></div>
	<div id="gameMaterial1"></div>
	<div id="gameMaterialCount1"></div>

	<div id="gamePlayer2"></div>
	<div id="gamePlayerRating2" style="display:none"></div>
	<div id="gameClock2"></div>
	<div id="gameMaterial2"></div>
	<div id="gameMaterialCount2"></div>

	<div id="gameDescription"></div>
	<div id="gameStatus"></div>
	<div id="gameOutcome"></div>

	<a id="gameReset"></a>

	<div id="gameActionsBar" style="display:none">
		<button id="gameResign"></button>
		<button id="gameAbort"></button>
		<button id="gameOfferDraw"></button>
	</div>

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

	public async save(): Promise<void> {
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

	public async saveToHistory(
		_white:      string,
		_black:      string,
		_result:     string,
		_source?:    'local' | 'lichess',
		_lichessId?: string,
	): Promise<void> {
		return;
	}
}

export function mockGameDeps(cfg: TestGameConfig): GameDeps {
	const deps = newGameDeps(cfg.boardUI);
	deps.state = new TestGameState(cfg);
	return deps;
}

export function setupGameTestDOM(): void {
	document.body.innerHTML = mockConfigGameUI();
}

// --- Lichess mock factories ---

export type LichessCallbacks = {
	challenge?:  (challenge: LichessChallenge) => void;
	gameStart?:  (gameId: string) => void;
	gameFinish?: (gameId: string) => void;
	gameFull?:   (event: LichessGameFull) => void;
};

export function mockLichessAuth(loggedIn = false): LichessAuth {
	return {
		isLoggedIn: vi.fn(() => loggedIn),
		getUser:    vi.fn(() => null),
	} as unknown as LichessAuth;
}

export function mockLichessClient(): LichessClient {
	return {
		get:       vi.fn(),
		post:      vi.fn(),
		getStream: vi.fn(),
	} as unknown as LichessClient;
}

export function mockLichessGame(): { game: LichessGame; cbs: LichessCallbacks } {
	const cbs: LichessCallbacks = {};
	const game = {
		seek:               vi.fn(() => Promise.resolve('mock-game-id')),
		cancelSeek:         vi.fn(),
		isSeeking:          false,
		acceptChallenge:    vi.fn(() => Promise.resolve()),
		declineChallenge:   vi.fn(() => Promise.resolve()),
		resign:             vi.fn(() => Promise.resolve()),
		abort:              vi.fn(() => Promise.resolve()),
		offerOrAcceptDraw:  vi.fn(() => Promise.resolve()),
		startEventStream:   vi.fn(),
		stopAll:            vi.fn(),
		onChallenge:        vi.fn((cb: (c: LichessChallenge) => void) => { cbs.challenge  = cb; }),
		onGameStart:        vi.fn((cb: (id: string) => void)         => { cbs.gameStart  = cb; }),
		onGameFinish:       vi.fn((cb: (id: string) => void)         => { cbs.gameFinish = cb; }),
		onGameFull:         vi.fn((cb: (e: LichessGameFull) => void) => { cbs.gameFull   = cb; }),
		onGameState:        vi.fn(),
		onDrawOffer:        vi.fn(),
		onTakebackOffer:    vi.fn(),
	} as unknown as LichessGame;
	return { game, cbs };
}

export function setupLichessTestDOM(): void {
	document.body.innerHTML = `
		<div id="lichessLogin"></div>
		<div id="lichessLogout" style="display:none"></div>
		<div id="lichessUser" style="display:none"></div>
		<div id="lichessSeekModal"></div>
		<p id="lichessSeekTimeCtrl"></p>
		<div id="lichessChallengeModal" style="display:none"></div>
		<span id="lichessChallengerName"></span>
		<span id="lichessChallengerRating"></span>
		<p id="lichessChallengeTimeCtrl"></p>
		<div id="gameActionsBar" style="display:none"></div>
		<div id="gamePlayer1"></div>
		<div id="gamePlayerRating1" style="display:none"></div>
		<div id="gamePlayer2"></div>
		<div id="gamePlayerRating2" style="display:none"></div>
		<div id="playModeSelector"></div>
		<span id="playModeLabel">Over the board</span>
		<div id="playModeDropdown"></div>
		<p id="playModeLoginPrompt" style="display:none"></p>
	`;
}
