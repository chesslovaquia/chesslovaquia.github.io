// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, beforeEach, afterEach, describe } from 'vitest';

import { LichessUIBridge } from '../../lichess/LichessUIBridge';
import { LichessAuth     } from '../../lichess/LichessAuth';
import { ClvqLocalStorage } from '../../clvq/ClvqLocalStorage';

import { mockLichessAuth, mockLichessGame, setupLichessTestDOM } from '../../testing/testing';

function makeBridge(auth: LichessAuth): LichessUIBridge {
	return new LichessUIBridge(auth, new ClvqLocalStorage());
}

beforeEach(() => {
	setupLichessTestDOM();
	localStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
	localStorage.clear();
});

// --- showSeekModal / hideSeekModal ---

describe('LichessUIBridge seek modal', () => {
	test('showSeekModal sets time control text and adds .active class', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		bridge.showSeekModal('15+10');
		expect(document.getElementById('lichessSeekTimeCtrl')?.textContent).toBe('15+10');
		expect(document.getElementById('lichessSeekModal')?.classList.contains('active')).toBe(true);
	});

	test('hideSeekModal removes .active class', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		bridge.showSeekModal('3+2');
		bridge.hideSeekModal();
		expect(document.getElementById('lichessSeekModal')?.classList.contains('active')).toBe(false);
	});

	test('onGameStart hides seek modal', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		bridge.showSeekModal('10+0');
		vi.stubGlobal('location', { assign: vi.fn() });
		cbs.gameStart!('game-seek-1');
		expect(document.getElementById('lichessSeekModal')?.classList.contains('active')).toBe(false);
		vi.unstubAllGlobals();
	});

	test('onGameStart navigates to /play/', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		const assignFn = vi.fn();
		vi.stubGlobal('location', { assign: assignFn });
		cbs.gameStart!('game-seek-2');
		expect(assignFn).toHaveBeenCalledWith('/play/');
		vi.unstubAllGlobals();
	});
});

// --- setup: challenge callback ---

describe('LichessUIBridge challenge callback', () => {
	test('sets pendingChallengeId', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.challenge!({
			id: 'chal-1',
			challenger: { id: 'u1', username: 'Rival', rating: 1500 },
			destUser: null,
			timeControl: { type: 'clock', limit: 600, increment: 0 },
			color: 'random',
			variant: { key: 'standard' },
		});
		expect(bridge.pendingChallengeId).toBe('chal-1');
	});

	test('populates challenger name element', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.challenge!({
			id: 'chal-2',
			challenger: { id: 'u2', username: 'DeepBlue', rating: 2900 },
			destUser: null,
			timeControl: { type: 'clock', limit: 600, increment: 0 },
			color: 'random',
			variant: { key: 'standard' },
		});
		expect(document.getElementById('lichessChallengerName')?.textContent).toBe('DeepBlue');
	});

	test('populates challenger rating element', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.challenge!({
			id: 'chal-3',
			challenger: { id: 'u3', username: 'Player', rating: 1750 },
			destUser: null,
			timeControl: { type: 'clock', limit: 900, increment: 10 },
			color: 'random',
			variant: { key: 'standard' },
		});
		expect(document.getElementById('lichessChallengerRating')?.textContent).toBe('(1750)');
	});

	test('formats clock time control as M+I', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.challenge!({
			id: 'chal-4',
			challenger: { id: 'u4', username: 'Swift', rating: 1600 },
			destUser: null,
			timeControl: { type: 'clock', limit: 900, increment: 10 },
			color: 'random',
			variant: { key: 'standard' },
		});
		expect(document.getElementById('lichessChallengeTimeCtrl')?.textContent).toBe('15+10');
	});

	test('falls back to type string for non-clock time control', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.challenge!({
			id: 'chal-5',
			challenger: { id: 'u5', username: 'Slow', rating: 1200 },
			destUser: null,
			timeControl: { type: 'correspondence' },
			color: 'random',
			variant: { key: 'standard' },
		});
		expect(document.getElementById('lichessChallengeTimeCtrl')?.textContent).toBe('correspondence');
	});
});

// --- setup: gameStart / gameFinish callbacks ---

describe('LichessUIBridge game start/finish', () => {
	test('sets activeGameId on game start', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.gameStart!('game-abc');
		expect(bridge.activeGameId).toBe('game-abc');
	});

	test('shows actions bar on game start', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.gameStart!('game-live');
		expect(document.getElementById('gameActionsBar')?.style.display).toBe('');
	});

	test('clears activeGameId on game finish', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.gameStart!('game-abc');
		cbs.gameFinish!('game-abc');
		expect(bridge.activeGameId).toBeNull();
	});

	test('hides actions bar on game finish', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.gameStart!('game-live');
		cbs.gameFinish!('game-live');
		expect(document.getElementById('gameActionsBar')?.style.display).toBe('none');
	});
});

// --- setup: gameFull callback ---

describe('LichessUIBridge gameFull callback', () => {
	test('sets white player name and rating', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.gameFull!({
			id: 'gf1',
			white: { id: 'w1', username: 'White', rating: 1900 },
			black: { id: 'b1', username: 'Black', rating: 1850 },
			state: { moves: '', wtime: 600000, btime: 600000, winc: 0, binc: 0, status: 'started' },
			variant: { key: 'standard' },
		});
		expect(document.getElementById('gamePlayer1')?.textContent).toBe('White');
		expect(document.getElementById('gamePlayerRating1')?.textContent).toBe('(1900)');
	});

	test('sets black player name and rating', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.gameFull!({
			id: 'gf2',
			white: { id: 'w2', username: 'Kasparov', rating: 2851 },
			black: { id: 'b2', username: 'Karpov', rating: 2780 },
			state: { moves: '', wtime: 900000, btime: 900000, winc: 10000, binc: 10000, status: 'started' },
			variant: { key: 'standard' },
		});
		expect(document.getElementById('gamePlayer2')?.textContent).toBe('Karpov');
		expect(document.getElementById('gamePlayerRating2')?.textContent).toBe('(2780)');
	});
});

// --- acceptChallenge ---

describe('LichessUIBridge.acceptChallenge', () => {
	test('calls game.acceptChallenge with pending id', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.challenge!({
			id: 'chal-acc',
			challenger: { id: 'u', username: 'Op', rating: 1500 },
			destUser: null,
			timeControl: { type: 'clock', limit: 600, increment: 0 },
			color: 'random',
			variant: { key: 'standard' },
		});
		bridge.acceptChallenge(game);
		expect(game.acceptChallenge).toHaveBeenCalledWith('chal-acc');
	});

	test('clears pendingChallengeId after accept', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.challenge!({
			id: 'chal-clr',
			challenger: { id: 'u', username: 'Op', rating: 1500 },
			destUser: null,
			timeControl: { type: 'clock', limit: 600, increment: 0 },
			color: 'random',
			variant: { key: 'standard' },
		});
		bridge.acceptChallenge(game);
		expect(bridge.pendingChallengeId).toBeNull();
	});
});

// --- declineChallenge ---

describe('LichessUIBridge.declineChallenge', () => {
	test('calls game.declineChallenge with pending id', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.challenge!({
			id: 'chal-dec',
			challenger: { id: 'u', username: 'Op', rating: 1800 },
			destUser: null,
			timeControl: { type: 'clock', limit: 1800, increment: 20 },
			color: 'black',
			variant: { key: 'standard' },
		});
		bridge.declineChallenge(game);
		expect(game.declineChallenge).toHaveBeenCalledWith('chal-dec');
	});

	test('clears pendingChallengeId after decline', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.challenge!({
			id: 'chal-dec2',
			challenger: { id: 'u', username: 'Op', rating: 1800 },
			destUser: null,
			timeControl: { type: 'clock', limit: 1800, increment: 20 },
			color: 'black',
			variant: { key: 'standard' },
		});
		bridge.declineChallenge(game);
		expect(bridge.pendingChallengeId).toBeNull();
	});
});

// --- resign / abort / offerDraw ---

describe('LichessUIBridge.resign', () => {
	test('calls game.resign with active game id', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.gameStart!('game-res');
		bridge.resign(game);
		expect(game.resign).toHaveBeenCalledWith('game-res');
	});
});

describe('LichessUIBridge.abort', () => {
	test('calls game.abort with active game id', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.gameStart!('game-abt');
		bridge.abort(game);
		expect(game.abort).toHaveBeenCalledWith('game-abt');
	});
});

describe('LichessUIBridge.offerDraw', () => {
	test('calls game.offerOrAcceptDraw with active game id', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		cbs.gameStart!('game-drw');
		bridge.offerDraw(game);
		expect(game.offerOrAcceptDraw).toHaveBeenCalledWith('game-drw');
	});
});

// --- updateUI ---

describe('LichessUIBridge.updateUI', () => {
	test('shows login button when not logged in', () => {
		const auth = mockLichessAuth(false);
		const bridge = makeBridge(auth);
		bridge.updateUI();
		expect(document.getElementById('lichessLogin')?.style.display).toBe('');
		expect(document.getElementById('lichessLogout')?.style.display).toBe('none');
	});

	test('shows logout button when logged in', () => {
		const auth = {
			isLoggedIn: vi.fn(() => true),
			getUser:    vi.fn(() => ({ username: 'TestUser', rating: 1500, title: null })),
		} as unknown as LichessAuth;
		const bridge = makeBridge(auth);
		bridge.updateUI();
		expect(document.getElementById('lichessLogin')?.style.display).toBe('none');
		expect(document.getElementById('lichessLogout')?.style.display).toBe('');
	});

	test('shows username when logged in', () => {
		const auth = {
			isLoggedIn: vi.fn(() => true),
			getUser:    vi.fn(() => ({ username: 'Magnus', rating: 2882, title: null })),
		} as unknown as LichessAuth;
		const bridge = makeBridge(auth);
		bridge.updateUI();
		expect(document.getElementById('lichessUser')?.textContent).toBe('Magnus (2882)');
	});

	test('includes title in username display when present', () => {
		const auth = {
			isLoggedIn: vi.fn(() => true),
			getUser:    vi.fn(() => ({ username: 'Carlsen', rating: 2882, title: 'GM' })),
		} as unknown as LichessAuth;
		const bridge = makeBridge(auth);
		bridge.updateUI();
		expect(document.getElementById('lichessUser')?.textContent).toBe('GM Carlsen (2882)');
	});
});

// --- game ID persistence ---

describe('LichessUIBridge game ID persistence', () => {
	test('persists game ID to localStorage on gameStart', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		vi.stubGlobal('location', { assign: vi.fn() });
		cbs.gameStart!('persist-game-1');
		expect(localStorage.getItem('lichess_game_id')).toBe('persist-game-1');
		vi.unstubAllGlobals();
	});

	test('removes game ID from localStorage on gameFinish', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		const { game, cbs } = mockLichessGame();
		bridge.setup(game);
		vi.stubGlobal('location', { assign: vi.fn() });
		cbs.gameStart!('persist-game-2');
		vi.unstubAllGlobals();
		cbs.gameFinish!('persist-game-2');
		expect(localStorage.getItem('lichess_game_id')).toBeNull();
	});

	test('restores activeGameId from localStorage on construction', () => {
		localStorage.setItem('lichess_game_id', 'restored-game-id');
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		expect(bridge.activeGameId).toBe('restored-game-id');
	});

	test('hasActiveGame returns true when game ID is set', () => {
		localStorage.setItem('lichess_game_id', 'active-game');
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		expect(bridge.hasActiveGame()).toBe(true);
	});

	test('hasActiveGame returns false when no game ID', () => {
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		expect(bridge.hasActiveGame()).toBe(false);
	});

	test('getActiveGameId returns stored game ID', () => {
		localStorage.setItem('lichess_game_id', 'my-game-id');
		const auth = mockLichessAuth();
		const bridge = makeBridge(auth);
		expect(bridge.getActiveGameId()).toBe('my-game-id');
	});
});
