// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { GameEngine  } from '../engine/GameEngine';
import { EngineColor } from '../engine/GameEngine';

import type { BoardSquare         } from '../board/GameBoard';
import type { BoardColor          } from '../board/GameBoard';
import type { BoardPromotionPiece } from '../board/GameBoard';

import { GameClock    } from '../game/GameClock';
import { GameNavigate } from '../game/GameNavigate';
import { GameState    } from '../game/GameState';

import { LichessGame                       } from './LichessGame';
import type { LichessGameFull              } from './LichessGame';
import type { LichessGameState as StateMsg } from './LichessGame';

import { EventOpponentMove } from '../events/EventOpponentMove';
import { EventGameOver     } from '../events/EventGameOver';

// Statuses that end the game and are not detected locally by chess.js.
const onlineGameOverStatuses = new Set([
	'resign', 'outoftime', 'draw', 'stalemate', 'aborted',
	'noStart', 'cheat', 'timeout', 'unknownFinish', 'variantEnd',
]);

export class LichessGameState implements GameState {
	private readonly lichessGame:  LichessGame;
	private readonly engine:       GameEngine;
	private readonly clock:        GameClock;
	private readonly nav:          GameNavigate;
	private readonly gameId:       string;
	private readonly playerUserId: string;

	private playerColor:     EngineColor;
	private viewOrientation: EngineColor;
	private movesCount:      number;
	private opponentName:    string;
	private opponentRating:  number | undefined;

	constructor(
		lichessGame:  LichessGame,
		engine:       GameEngine,
		clock:        GameClock,
		nav:          GameNavigate,
		gameId:       string,
		playerUserId: string,
	) {
		this.lichessGame    = lichessGame;
		this.engine         = engine;
		this.clock          = clock;
		this.nav            = nav;
		this.gameId         = gameId;
		this.playerUserId   = playerUserId.toLowerCase();
		this.playerColor    = 'w';
		this.viewOrientation = 'w';
		this.movesCount     = 0;
		this.opponentName   = 'Opponent';
		this.opponentRating = undefined;
	}

	public reset(): void {
		this.lichessGame.abort(this.gameId).catch((err: unknown) => {
			console.error('Lichess abort error:', err);
		});
	}

	public async save(): Promise<void> {
		// Lichess is authoritative — no local persistence needed.
	}

	public async load(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			this.lichessGame.onGameFull((full) => {
				this.handleGameFull(full);
				resolve(true);
			});
			this.lichessGame.onGameState((state) => {
				this.handleGameState(state);
			});
			this.lichessGame.startGameStream(this.gameId);
		});
	}

	public async setupNewGame(): Promise<boolean> {
		// Game was already started externally via seek or challenge.
		return false;
	}

	public getOrientation(): EngineColor {
		return this.viewOrientation;
	}

	public toggleOrientation(): void {
		this.viewOrientation = this.viewOrientation === 'w' ? 'b' : 'w';
	}

	public gameDescription(): string {
		const rating = this.opponentRating !== undefined ? ` (${this.opponentRating})` : '';
		return `Lichess: vs ${this.opponentName}${rating}`;
	}

	public getPlayerColor(): BoardColor {
		return this.playerColor === 'w' ? 'white' : 'black';
	}

	private handleGameFull(full: LichessGameFull): void {
		// Determine player color and opponent info.
		if (full.white.id.toLowerCase() === this.playerUserId) {
			this.playerColor     = 'w';
			this.viewOrientation = 'w';
			this.opponentName    = full.black.username;
			this.opponentRating  = full.black.rating;
		} else {
			this.playerColor     = 'b';
			this.viewOrientation = 'b';
			this.opponentName    = full.white.username;
			this.opponentRating  = full.white.rating;
		}

		// Replay existing moves into engine.
		const uciMoves = this.parseUCIMoves(full.state.moves);
		for (const { from, to, promotion } of uciMoves) {
			this.engine.move({ from, to, promotion });
		}
		this.movesCount = uciMoves.length;

		// Disable first-move timer — server clock is authoritative.
		this.clock.disableFirstMoveTimer();

		// Sync clock from server times.
		this.clock.syncTimes(full.state.wtime, full.state.btime);
	}

	private handleGameState(state: StateMsg): void {
		const uciMoves = this.parseUCIMoves(state.moves);

		// Dispatch EventOpponentMove for each new move since last sync.
		for (let i = this.movesCount; i < uciMoves.length; i++) {
			const { from, to, promotion } = uciMoves[i];
			const evt = new EventOpponentMove({ from, to, promotion });
			EventOpponentMove.Target.dispatchEvent(evt);
		}
		this.movesCount = uciMoves.length;

		// Sync clock from server.
		this.clock.syncTimes(state.wtime, state.btime);

		// Dispatch EventGameOver for endings chess.js won't detect locally.
		if (state.status !== 'started' && state.status !== 'created') {
			if (onlineGameOverStatuses.has(state.status)) {
				const winner = state.winner === 'white' ? 'white'
				             : state.winner === 'black' ? 'black'
				             : undefined;
				const evt = new EventGameOver({ reason: state.status, winner });
				EventGameOver.Target.dispatchEvent(evt);
			}
		}
	}

	private parseUCIMoves(movesStr: string): Array<{
		from:      BoardSquare;
		to:        BoardSquare;
		promotion: BoardPromotionPiece;
	}> {
		if (!movesStr || movesStr.trim() === '') {
			return [];
		}
		return movesStr.trim().split(' ').map(uci => ({
			from:      uci.slice(0, 2) as BoardSquare,
			to:        uci.slice(2, 4) as BoardSquare,
			promotion: (uci.length >= 5 ? uci[4] : 'q') as BoardPromotionPiece,
		}));
	}
}
