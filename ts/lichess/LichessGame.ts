// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LichessClient } from './LichessClient';
import { LichessStream  } from './LichessStream';
import type { StreamEvent } from './LichessStream';

export type SeekParams = {
	time:      number;
	increment: number;
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

	public async seek(params: SeekParams): Promise<void> {
		const body = new URLSearchParams({
			time:      String(params.time),
			increment: String(params.increment),
			color:     params.color   ?? 'random',
			variant:   params.variant ?? 'standard',
		});
		await this.client.post('/api/board/seek', body);
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
		this.stream.closeAll();
	}

	// --- Private event routing ---

	private handleEventStreamEvent(event: StreamEvent): void {
		switch (event.type) {
			case 'challenge': {
				const payload = event as unknown as { challenge: LichessChallenge };
				this.challengeCallback?.(payload.challenge);
				break;
			}
			case 'gameStart': {
				const payload = event as unknown as { game: { gameId: string } };
				this.gameStartCallback?.(payload.game.gameId);
				break;
			}
			case 'gameFinish': {
				const payload = event as unknown as { game: { gameId: string } };
				this.gameFinishCallback?.(payload.game.gameId);
				break;
			}
			default:
				break;
		}
	}

	private handleGameStreamEvent(event: StreamEvent): void {
		switch (event.type) {
			case 'gameFull': {
				const payload = event as unknown as LichessGameFull;
				this.gameFullCallback?.(payload);
				break;
			}
			case 'gameState': {
				const state = event as unknown as LichessGameState;

				if (state.wdraw && !this.lastWdraw) {
					this.drawOfferCallback?.('white');
				}
				if (state.bdraw && !this.lastBdraw) {
					this.drawOfferCallback?.('black');
				}
				if (state.wtakeback && !this.lastWtakeback) {
					this.takebackCallback?.('white');
				}
				if (state.btakeback && !this.lastBtakeback) {
					this.takebackCallback?.('black');
				}

				this.lastWdraw     = state.wdraw     ?? false;
				this.lastBdraw     = state.bdraw     ?? false;
				this.lastWtakeback = state.wtakeback ?? false;
				this.lastBtakeback = state.btakeback ?? false;

				this.gameStateCallback?.(state);
				break;
			}
			default:
				break;
		}
	}
}
