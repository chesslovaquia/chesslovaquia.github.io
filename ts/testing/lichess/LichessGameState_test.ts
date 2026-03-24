// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, describe, beforeEach, afterEach } from 'vitest';

import { LichessGameState } from '../../lichess/LichessGameState';
import { LichessGame      } from '../../lichess/LichessGame';
import type { LichessGameFull              } from '../../lichess/LichessGame';
import type { LichessGameState as StateMsg } from '../../lichess/LichessGame';

import { GameEngine  } from '../../engine/GameEngine';
import { GameClock   } from '../../game/GameClock';
import { GameNavigate } from '../../game/GameNavigate';

import { EventOpponentMove } from '../../events/EventOpponentMove';
import { EventGameOver     } from '../../events/EventGameOver';

// --- Fixtures ---

function makeGameFull(overrides: Partial<LichessGameFull> = {}): LichessGameFull {
	return {
		id:      'testgame1',
		white:   { id: 'player1', username: 'Player1', rating: 1500 },
		black:   { id: 'opponent1', username: 'Opponent1', rating: 1600 },
		state:   { moves: '', wtime: 600000, btime: 600000, winc: 0, binc: 0, status: 'started' },
		variant: { key: 'standard' },
		...overrides,
	};
}

function makeStateMsg(overrides: Partial<StateMsg> = {}): StateMsg {
	return {
		moves:  '',
		wtime:  600000,
		btime:  600000,
		winc:   0,
		binc:   0,
		status: 'started',
		...overrides,
	};
}

// --- Mocks ---

type GameFullCb  = (full: LichessGameFull) => void;
type GameStateCb = (state: StateMsg) => void;

function mockLichessGame(): { game: LichessGame; triggerFull: (f: LichessGameFull) => void; triggerState: (s: StateMsg) => void } {
	let fullCb:  GameFullCb  | undefined;
	let stateCb: GameStateCb | undefined;

	const game = {
		onGameFull:      vi.fn((cb: GameFullCb)  => { fullCb  = cb; }),
		onGameState:     vi.fn((cb: GameStateCb) => { stateCb = cb; }),
		startGameStream: vi.fn(),
		stopGameStream:  vi.fn(),
		abort:           vi.fn(() => Promise.resolve(new Response('', { status: 200 }))),
	} as unknown as LichessGame;

	return {
		game,
		triggerFull:  (f) => fullCb?.(f),
		triggerState: (s) => stateCb?.(s),
	};
}

function mockEngine(): GameEngine {
	return {
		move:     vi.fn(() => ({ from: 'e2', to: 'e4', inCheck: false, turnColor: 'black' })),
		turn:     vi.fn(() => 'w' as const),
		getState: vi.fn(() => [] as string[]),
		lastMove: vi.fn(() => undefined),
	} as unknown as GameEngine;
}

function mockClock(): GameClock {
	return {
		disableFirstMoveTimer: vi.fn(),
		syncTimes:             vi.fn(),
	} as unknown as GameClock;
}

function mockNav(): GameNavigate {
	return {
		addPosition: vi.fn(),
	} as unknown as GameNavigate;
}

afterEach(() => {
	vi.restoreAllMocks();
});

// --- Tests ---

describe('LichessGameState.load', () => {
	test('starts game stream and resolves true when gameFull arrives', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');

		const loadPromise = ls.load();
		expect(game.startGameStream).toHaveBeenCalledWith('game1');
		expect(game.onGameFull).toHaveBeenCalled();

		triggerFull(makeGameFull());
		const result = await loadPromise;
		expect(result).toBe(true);
	});

	test('registers gameState callback before starting stream', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const loadPromise = ls.load();
		triggerFull(makeGameFull());
		await loadPromise;
		expect(game.onGameState).toHaveBeenCalled();
	});
});

describe('LichessGameState player color', () => {
	test('detects white player color', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull({ white: { id: 'player1', username: 'Player1', rating: 1500 } }));
		await p;
		expect(ls.getPlayerColor()).toBe('white');
	});

	test('detects black player color', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull({ white: { id: 'other', username: 'Other', rating: 1500 } }));
		await p;
		expect(ls.getPlayerColor()).toBe('black');
	});

	test('getOrientation returns b when player is black', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull({ white: { id: 'other', username: 'Other', rating: 1400 } }));
		await p;
		expect(ls.getOrientation()).toBe('b');
	});
});

describe('LichessGameState.gameDescription', () => {
	test('formats opponent name and rating', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull());
		await p;
		expect(ls.gameDescription()).toBe('Lichess: vs Opponent1 (1600)');
	});

	test('omits rating when undefined', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull({ black: { id: 'opp', username: 'Opp' } }));
		await p;
		expect(ls.gameDescription()).toBe('Lichess: vs Opp');
	});
});

describe('LichessGameState move replay', () => {
	test('replays existing UCI moves into engine on gameFull', async () => {
		const engine = mockEngine();
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, engine, mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull({ state: { moves: 'e2e4 e7e5', wtime: 600000, btime: 600000, winc: 0, binc: 0, status: 'started' } }));
		await p;
		expect(engine.move).toHaveBeenCalledTimes(2);
		expect(engine.move).toHaveBeenNthCalledWith(1, { from: 'e2', to: 'e4', promotion: 'q' });
		expect(engine.move).toHaveBeenNthCalledWith(2, { from: 'e7', to: 'e5', promotion: 'q' });
	});

	test('handles empty moves string', async () => {
		const engine = mockEngine();
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, engine, mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull({ state: { moves: '', wtime: 600000, btime: 600000, winc: 0, binc: 0, status: 'started' } }));
		await p;
		expect(engine.move).not.toHaveBeenCalled();
	});

	test('parses promotion piece from UCI', async () => {
		const engine = mockEngine();
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, engine, mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull({ state: { moves: 'e7e8q', wtime: 600000, btime: 600000, winc: 0, binc: 0, status: 'started' } }));
		await p;
		expect(engine.move).toHaveBeenCalledWith({ from: 'e7', to: 'e8', promotion: 'q' });
	});
});

describe('LichessGameState clock sync', () => {
	test('disables first move timer and syncs clock on gameFull', async () => {
		const clock = mockClock();
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), clock, mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull({ state: { moves: '', wtime: 300000, btime: 600000, winc: 0, binc: 0, status: 'started' } }));
		await p;
		expect(clock.disableFirstMoveTimer).toHaveBeenCalled();
		expect(clock.syncTimes).toHaveBeenCalledWith(300000, 600000);
	});

	test('syncs clock on gameState', async () => {
		const clock = mockClock();
		const { game, triggerFull, triggerState } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), clock, mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull());
		await p;
		triggerState(makeStateMsg({ moves: 'e2e4', wtime: 590000, btime: 600000 }));
		expect(clock.syncTimes).toHaveBeenLastCalledWith(590000, 600000);
	});
});

describe('LichessGameState EventOpponentMove', () => {
	test('dispatches EventOpponentMove for new moves on gameState', async () => {
		const { game, triggerFull, triggerState } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull());
		await p;

		const received: Array<{ from: string; to: string }> = [];
		const handler = (evt: Event) => {
			const e = evt as EventOpponentMove;
			received.push({ from: e.detail.from, to: e.detail.to });
		};
		document.addEventListener(EventOpponentMove.Name, handler);
		try {
			triggerState(makeStateMsg({ moves: 'e2e4' }));
			expect(received).toHaveLength(1);
			expect(received[0]).toEqual({ from: 'e2', to: 'e4' });
		} finally {
			document.removeEventListener(EventOpponentMove.Name, handler);
		}
	});

	test('does not re-dispatch moves already seen', async () => {
		const { game, triggerFull, triggerState } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		// gameFull already has one move
		triggerFull(makeGameFull({ state: { moves: 'e2e4', wtime: 600000, btime: 600000, winc: 0, binc: 0, status: 'started' } }));
		await p;

		const received: string[] = [];
		const handler = (evt: Event) => received.push((evt as EventOpponentMove).detail.from);
		document.addEventListener(EventOpponentMove.Name, handler);
		try {
			// gameState delivers the same moves + one new
			triggerState(makeStateMsg({ moves: 'e2e4 e7e5' }));
			expect(received).toHaveLength(1);
			expect(received[0]).toBe('e7');
		} finally {
			document.removeEventListener(EventOpponentMove.Name, handler);
		}
	});
});

describe('LichessGameState EventGameOver', () => {
	async function setupAndLoad(playerUserId = 'player1'): Promise<{
		triggerState: (s: StateMsg) => void;
		ls: LichessGameState;
	}> {
		const { game, triggerFull, triggerState } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', playerUserId);
		const p = ls.load();
		triggerFull(makeGameFull());
		await p;
		return { triggerState, ls };
	}

	test('dispatches EventGameOver on resign', async () => {
		const { triggerState } = await setupAndLoad();
		const received: Array<{ reason: string; winner?: string }> = [];
		const handler = (evt: Event) => {
			const e = evt as EventGameOver;
			received.push({ reason: e.detail.reason, winner: e.detail.winner });
		};
		document.addEventListener(EventGameOver.Name, handler);
		try {
			triggerState(makeStateMsg({ status: 'resign', winner: 'white' }));
			expect(received).toHaveLength(1);
			expect(received[0].reason).toBe('resign');
			expect(received[0].winner).toBe('white');
		} finally {
			document.removeEventListener(EventGameOver.Name, handler);
		}
	});

	test('dispatches EventGameOver on outoftime', async () => {
		const { triggerState } = await setupAndLoad();
		const received: string[] = [];
		const handler = (evt: Event) => received.push((evt as EventGameOver).detail.reason);
		document.addEventListener(EventGameOver.Name, handler);
		try {
			triggerState(makeStateMsg({ status: 'outoftime', winner: 'black' }));
			expect(received).toEqual(['outoftime']);
		} finally {
			document.removeEventListener(EventGameOver.Name, handler);
		}
	});

	test('dispatches EventGameOver on draw', async () => {
		const { triggerState } = await setupAndLoad();
		const received: string[] = [];
		const handler = (evt: Event) => received.push((evt as EventGameOver).detail.reason);
		document.addEventListener(EventGameOver.Name, handler);
		try {
			triggerState(makeStateMsg({ status: 'draw' }));
			expect(received).toEqual(['draw']);
		} finally {
			document.removeEventListener(EventGameOver.Name, handler);
		}
	});

	test('dispatches EventGameOver on aborted', async () => {
		const { triggerState } = await setupAndLoad();
		const received: string[] = [];
		const handler = (evt: Event) => received.push((evt as EventGameOver).detail.reason);
		document.addEventListener(EventGameOver.Name, handler);
		try {
			triggerState(makeStateMsg({ status: 'aborted' }));
			expect(received).toEqual(['aborted']);
		} finally {
			document.removeEventListener(EventGameOver.Name, handler);
		}
	});

	test('does not dispatch EventGameOver for started status', async () => {
		const { triggerState } = await setupAndLoad();
		const received: string[] = [];
		const handler = (evt: Event) => received.push((evt as EventGameOver).detail.reason);
		document.addEventListener(EventGameOver.Name, handler);
		try {
			triggerState(makeStateMsg({ status: 'started', moves: 'e2e4' }));
			expect(received).toHaveLength(0);
		} finally {
			document.removeEventListener(EventGameOver.Name, handler);
		}
	});

	test('does not dispatch EventGameOver for mate (chess.js handles it)', async () => {
		const { triggerState } = await setupAndLoad();
		const received: string[] = [];
		const handler = (evt: Event) => received.push((evt as EventGameOver).detail.reason);
		document.addEventListener(EventGameOver.Name, handler);
		try {
			triggerState(makeStateMsg({ status: 'mate', winner: 'white' }));
			expect(received).toHaveLength(0);
		} finally {
			document.removeEventListener(EventGameOver.Name, handler);
		}
	});
});

describe('LichessGameState.save', () => {
	test('is a no-op', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull());
		await p;
		await expect(ls.save()).resolves.toBeUndefined();
	});
});

describe('LichessGameState.reset', () => {
	test('calls abort on lichess game', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull());
		await p;
		ls.reset();
		expect(game.abort).toHaveBeenCalledWith('game1');
	});
});

describe('LichessGameState.setupNewGame', () => {
	test('returns false', async () => {
		const { game } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		await expect(ls.setupNewGame()).resolves.toBe(false);
	});
});

describe('LichessGameState.toggleOrientation', () => {
	test('toggles view orientation', async () => {
		const { game, triggerFull } = mockLichessGame();
		const ls = new LichessGameState(game, mockEngine(), mockClock(), mockNav(), 'game1', 'player1');
		const p = ls.load();
		triggerFull(makeGameFull()); // player is white → orientation 'w'
		await p;
		expect(ls.getOrientation()).toBe('w');
		ls.toggleOrientation();
		expect(ls.getOrientation()).toBe('b');
		ls.toggleOrientation();
		expect(ls.getOrientation()).toBe('w');
	});
});
