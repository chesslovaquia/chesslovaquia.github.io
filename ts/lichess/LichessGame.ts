// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LichessClient } from './LichessClient';
import { LichessError  } from './LichessError';
import { LichessStream  } from './LichessStream';
import { readNdjson    } from './NdjsonReader';
import type { StreamEvent } from './LichessStream';

export type SeekParams = {
	time:      number;
	increment: number;
	days?:     number;
	color?:    'white' | 'black' | 'random';
	variant?:  string;
};

export type LichessChallenge = {
	id:          string;
	challenger:  { id: string; username: string; rating?: number };
	destUser:    { id: string; username: string; rating?: number } | null;
	timeControl: { type: string; limit?: number; increment?: number };
	color:       string;
	variant:     { key: string };
};

export type LichessGameFull = {
	id:      string;
	white:   { id: string; username: string; rating?: number };
	black:   { id: string; username: string; rating?: number };
	state:   LichessGameState;
	clock?:  { initial: number; increment: number };
	variant: { key: string };
};

export type LichessGameState = {
	moves:      string;
	wtime:      number;
	btime:      number;
	winc:       number;
	binc:       number;
	status:     string;
	winner?:    string;
	wdraw?:     boolean;
	bdraw?:     boolean;
	wtakeback?: boolean;
	btakeback?: boolean;
};

// Internal narrowed event types for type-safe stream routing
type ChallengeStreamEvent  = StreamEvent & { type: 'challenge';  challenge: LichessChallenge };
type GameStartStreamEvent  = StreamEvent & { type: 'gameStart';  game: { gameId: string } };
type GameFinishStreamEvent = StreamEvent & { type: 'gameFinish'; game: { gameId: string } };
type GameFullStreamEvent   = StreamEvent & { type: 'gameFull' } & LichessGameFull;
type GameStateStreamEvent  = StreamEvent & { type: 'gameState' } & LichessGameState;

function isChallengeEvent(e: StreamEvent): e is ChallengeStreamEvent {
	return e.type === 'challenge' && typeof (e as ChallengeStreamEvent).challenge === 'object';
}

function isGameStartEvent(e: StreamEvent): e is GameStartStreamEvent {
	return e.type === 'gameStart' && typeof (e as GameStartStreamEvent).game === 'object';
}

function isGameFinishEvent(e: StreamEvent): e is GameFinishStreamEvent {
	return e.type === 'gameFinish' && typeof (e as GameFinishStreamEvent).game === 'object';
}

function isGameFullEvent(e: StreamEvent): e is GameFullStreamEvent {
	return e.type === 'gameFull' && typeof (e as GameFullStreamEvent).id === 'string';
}

function isGameStateEvent(e: StreamEvent): e is GameStateStreamEvent {
	return e.type === 'gameState' && typeof (e as GameStateStreamEvent).moves === 'string';
}

type ChallengeCallback  = (challenge: LichessChallenge) => void;
type GameStartCallback  = (gameId: string) => void;
type GameFinishCallback = (gameId: string) => void;
type GameFullCallback   = (event: LichessGameFull) => void;
type GameStateCallback  = (event: LichessGameState) => void;
type DrawOfferCallback  = (color: string) => void;
type TakebackCallback   = (color: string) => void;

export class LichessGame {
	private readonly client: LichessClient;
	private readonly stream: LichessStream;

	private challengeCallback?:  ChallengeCallback;
	private gameStartCallback?:  GameStartCallback;
	private gameFinishCallback?: GameFinishCallback;
	private gameFullCallback?:   GameFullCallback;
	private gameStateCallback?:  GameStateCallback;
	private drawOfferCallback?:  DrawOfferCallback;
	private takebackCallback?:   TakebackCallback;

	private seekController: AbortController | null = null;

	private lastWdraw:     boolean = false;
	private lastBdraw:     boolean = false;
	private lastWtakeback: boolean = false;
	private lastBtakeback: boolean = false;

	constructor(client: LichessClient, stream: LichessStream) {
		this.client = client;
		this.stream = stream;
	}

	// --- Callback registration ---

	public onChallenge(cb: ChallengeCallback): void {
		this.challengeCallback = cb;
	}

	public onGameStart(cb: GameStartCallback): void {
		this.gameStartCallback = cb;
	}

	public onGameFinish(cb: GameFinishCallback): void {
		this.gameFinishCallback = cb;
	}

	public onGameFull(cb: GameFullCallback): void {
		this.gameFullCallback = cb;
	}

	public onGameState(cb: GameStateCallback): void {
		this.gameStateCallback = cb;
	}

	public onDrawOffer(cb: DrawOfferCallback): void {
		this.drawOfferCallback = cb;
	}

	public onTakebackOffer(cb: TakebackCallback): void {
		this.takebackCallback = cb;
	}

	// --- Seek ---

	public async seek(params: SeekParams): Promise<string> {
		this.cancelSeek();

		const body = new URLSearchParams({
			color:   params.color   ?? 'random',
			variant: params.variant ?? 'standard',
		});
		if (params.days !== undefined) {
			body.set('days', String(params.days));
		} else {
			body.set('time',      String(params.time));
			body.set('increment', String(params.increment));
		}

		const controller = new AbortController();
		this.seekController = controller;

		try {
			const stream = await this.client.postStream('/api/board/seek', body);
			let gameId = '';
			await readNdjson<{ id: string }>(stream, (event) => {
				if (event.id) {
					gameId = event.id;
				}
			}, { signal: controller.signal, onError: 'skip' });
			if (!gameId) {
				throw new LichessError('Seek stream closed without a game ID');
			}
			return gameId;
		} finally {
			this.seekController = null;
		}
	}

	public cancelSeek(): void {
		if (this.seekController) {
			this.seekController.abort();
			this.seekController = null;
		}
	}

	public get isSeeking(): boolean {
		return this.seekController !== null;
	}

	// --- Challenge management ---

	public async acceptChallenge(challengeId: string): Promise<void> {
		await this.client.post(`/api/challenge/${challengeId}/accept`);
	}

	public async declineChallenge(challengeId: string): Promise<void> {
		await this.client.post(`/api/challenge/${challengeId}/decline`);
	}

	// --- In-game actions ---

	public async abort(gameId: string): Promise<void> {
		await this.client.post(`/api/board/game/${gameId}/abort`);
	}

	public async resign(gameId: string): Promise<void> {
		await this.client.post(`/api/board/game/${gameId}/resign`);
	}

	public async offerOrAcceptDraw(gameId: string): Promise<void> {
		await this.client.post(`/api/board/game/${gameId}/draw/yes`);
	}

	public async declineDraw(gameId: string): Promise<void> {
		await this.client.post(`/api/board/game/${gameId}/draw/no`);
	}

	public async offerOrAcceptTakeback(gameId: string): Promise<void> {
		await this.client.post(`/api/board/game/${gameId}/takeback/yes`);
	}

	public async declineTakeback(gameId: string): Promise<void> {
		await this.client.post(`/api/board/game/${gameId}/takeback/no`);
	}

	public async makeMove(gameId: string, uci: string): Promise<void> {
		await this.client.post(`/api/board/game/${gameId}/move/${uci}`);
	}

	// --- Stream lifecycle ---

	public startEventStream(): void {
		this.stream.openEventStream(this.handleEventStreamEvent.bind(this));
	}

	public stopEventStream(): void {
		this.stream.closeEventStream();
	}

	public startGameStream(gameId: string): void {
		this.stream.openGameStream(gameId, this.handleGameStreamEvent.bind(this));
	}

	public stopGameStream(): void {
		this.stream.closeGameStream();
		this.lastWdraw     = false;
		this.lastBdraw     = false;
		this.lastWtakeback = false;
		this.lastBtakeback = false;
	}

	public stopAll(): void {
		this.cancelSeek();
		this.stream.closeAll();
	}

	// --- Private event routing ---

	private handleEventStreamEvent(event: StreamEvent): void {
		switch (event.type) {
			case 'challenge': {
				if (isChallengeEvent(event)) {
					this.challengeCallback?.(event.challenge);
				}
				break;
			}
			case 'gameStart': {
				if (isGameStartEvent(event)) {
					this.gameStartCallback?.(event.game.gameId);
				}
				break;
			}
			case 'gameFinish': {
				if (isGameFinishEvent(event)) {
					this.gameFinishCallback?.(event.game.gameId);
				}
				break;
			}
			default:
				break;
		}
	}

	private handleGameStreamEvent(event: StreamEvent): void {
		switch (event.type) {
			case 'gameFull': {
				if (isGameFullEvent(event)) {
					this.gameFullCallback?.(event);
				}
				break;
			}
			case 'gameState': {
				if (isGameStateEvent(event)) {
					if (event.wdraw && !this.lastWdraw) {
						this.drawOfferCallback?.('white');
					}
					if (event.bdraw && !this.lastBdraw) {
						this.drawOfferCallback?.('black');
					}
					if (event.wtakeback && !this.lastWtakeback) {
						this.takebackCallback?.('white');
					}
					if (event.btakeback && !this.lastBtakeback) {
						this.takebackCallback?.('black');
					}

					this.lastWdraw     = event.wdraw     ?? false;
					this.lastBdraw     = event.bdraw     ?? false;
					this.lastWtakeback = event.wtakeback ?? false;
					this.lastBtakeback = event.btakeback ?? false;

					this.gameStateCallback?.(event);
				}
				break;
			}
			default:
				break;
		}
	}
}
