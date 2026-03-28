// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, beforeEach, afterEach, describe } from 'vitest';

import { Clvq } from '../../clvq/Clvq';
import { GameSetup } from '../../game/GameSetup';

import { mockLichessGame, setupLichessTestDOM } from '../../testing/testing';

beforeEach(() => {
	vi.stubGlobal('location', { search: '', pathname: '/', href: '', assign: vi.fn() });
	setupLichessTestDOM();
	localStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	localStorage.clear();
});

// --- play() dispatch ---

describe('Clvq.play', () => {
	test('dispatches to gameSetup in otb mode', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		const spy = vi.spyOn(GameSetup.prototype, 'newGame').mockImplementation(() => {});
		clvq.play(10, 5);
		expect(spy).toHaveBeenCalledWith({
			time: 600,
			increment: 5,
			desc: '10+5',
		});
	});

	test('dispatches to lichessSeek in lichess mode when logged in', () => {
		localStorage.setItem('lichess_token', 'test-token');
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		localStorage.setItem('clvq.play_mode', 'lichess');
		clvq.play(15, 10);
		expect(game.seek).toHaveBeenCalledWith({ time: 15, increment: 10 });
	});

	test('shows login prompt in lichess mode when not logged in', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		localStorage.setItem('clvq.play_mode', 'lichess');
		clvq.play(10, 0);
		expect(game.seek).not.toHaveBeenCalled();
		expect(document.getElementById('playModeLoginPrompt')?.style.display).toBe('');
	});
});

// --- playCorrespondence() dispatch ---

describe('Clvq.playCorrespondence', () => {
	test('dispatches to gameSetupCorrespondence in otb mode', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		const spy = vi.spyOn(GameSetup.prototype, 'newGame').mockImplementation(() => {});
		clvq.playCorrespondence(3);
		expect(spy).toHaveBeenCalledWith({
			time: 259200,
			increment: 0,
			desc: '3 days',
			correspondence: true,
		});
	});

	test('dispatches to lichess correspondence seek when logged in', () => {
		localStorage.setItem('lichess_token', 'test-token');
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		localStorage.setItem('clvq.play_mode', 'lichess');
		clvq.playCorrespondence(5);
		expect(game.seek).toHaveBeenCalledWith({ time: 0, increment: 0, days: 5 });
	});

	test('shows login prompt for lichess correspondence when not logged in', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		localStorage.setItem('clvq.play_mode', 'lichess');
		clvq.playCorrespondence(3);
		expect(game.seek).not.toHaveBeenCalled();
		expect(document.getElementById('playModeLoginPrompt')?.style.display).toBe('');
	});
});

// --- playModeToggle ---

describe('Clvq.playModeToggle', () => {
	test('toggles active class on dropdown', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		const dropdown = document.getElementById('playModeDropdown')!;
		expect(dropdown.classList.contains('active')).toBe(false);
		clvq.playModeToggle();
		expect(dropdown.classList.contains('active')).toBe(true);
		clvq.playModeToggle();
		expect(dropdown.classList.contains('active')).toBe(false);
	});
});

// --- playModeSelect ---

describe('Clvq.playModeSelect', () => {
	test('updates label to Lichess', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		clvq.playModeSelect('lichess');
		expect(document.getElementById('playModeLabel')?.textContent).toBe('Lichess');
	});

	test('updates label to Over the board', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		clvq.playModeSelect('lichess');
		clvq.playModeSelect('otb');
		expect(document.getElementById('playModeLabel')?.textContent).toBe('Over the board');
	});

	test('persists selected mode', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		clvq.playModeSelect('lichess');
		expect(localStorage.getItem('clvq.play_mode')).toBe('lichess');
	});

	test('hides login prompt when switching to otb', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		localStorage.setItem('clvq.play_mode', 'lichess');
		clvq.play(10, 0); // triggers login prompt
		clvq.playModeSelect('otb');
		expect(document.getElementById('playModeLoginPrompt')?.style.display).toBe('none');
	});
});

// --- initPlayModeUI ---

describe('Clvq initPlayModeUI', () => {
	test('sets label from persisted mode on construction', () => {
		localStorage.setItem('clvq.play_mode', 'lichess');
		const { game } = mockLichessGame();
		new Clvq({ lichessGame: game });
		expect(document.getElementById('playModeLabel')?.textContent).toBe('Lichess');
	});

	test('defaults label to Over the board', () => {
		const { game } = mockLichessGame();
		new Clvq({ lichessGame: game });
		expect(document.getElementById('playModeLabel')?.textContent).toBe('Over the board');
	});
});

// --- lichessResign ---

describe('Clvq.lichessResign', () => {
	test('does nothing when no active game', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		clvq.lichessResign();
		expect(game.resign).not.toHaveBeenCalled();
	});

	test('calls resign with active game id', async () => {
		const { game, cbs } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		cbs.gameStart!('game-abc');
		clvq.lichessResign();
		expect(game.resign).toHaveBeenCalledWith('game-abc');
	});
});

// --- lichessAbort ---

describe('Clvq.lichessAbort', () => {
	test('does nothing when no active game', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		clvq.lichessAbort();
		expect(game.abort).not.toHaveBeenCalled();
	});

	test('calls abort with active game id', () => {
		const { game, cbs } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		cbs.gameStart!('game-xyz');
		clvq.lichessAbort();
		expect(game.abort).toHaveBeenCalledWith('game-xyz');
	});
});

// --- lichessOfferDraw ---

describe('Clvq.lichessOfferDraw', () => {
	test('does nothing when no active game', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		clvq.lichessOfferDraw();
		expect(game.offerOrAcceptDraw).not.toHaveBeenCalled();
	});

	test('calls offerOrAcceptDraw with active game id', () => {
		const { game, cbs } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		cbs.gameStart!('game-draw');
		clvq.lichessOfferDraw();
		expect(game.offerOrAcceptDraw).toHaveBeenCalledWith('game-draw');
	});
});

// --- lichessAcceptChallenge ---

describe('Clvq.lichessAcceptChallenge', () => {
	test('does nothing when no pending challenge', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		clvq.lichessAcceptChallenge();
		expect(game.acceptChallenge).not.toHaveBeenCalled();
	});

	test('calls acceptChallenge with challenge id', () => {
		const { game, cbs } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		cbs.challenge!({
			id: 'chal-1',
			challenger: { id: 'user1', username: 'Opponent', rating: 1500 },
			destUser: null,
			timeControl: { type: 'clock', limit: 600, increment: 0 },
			color: 'random',
			variant: { key: 'standard' },
		});
		clvq.lichessAcceptChallenge();
		expect(game.acceptChallenge).toHaveBeenCalledWith('chal-1');
	});

	test('clears pending challenge id after accept', () => {
		const { game, cbs } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		cbs.challenge!({
			id: 'chal-2',
			challenger: { id: 'user2', username: 'Someone', rating: 1200 },
			destUser: null,
			timeControl: { type: 'clock', limit: 900, increment: 10 },
			color: 'white',
			variant: { key: 'standard' },
		});
		clvq.lichessAcceptChallenge();
		clvq.lichessAcceptChallenge(); // second call should be no-op
		expect(game.acceptChallenge).toHaveBeenCalledTimes(1);
	});
});

// --- lichessDeclineChallenge ---

describe('Clvq.lichessDeclineChallenge', () => {
	test('does nothing when no pending challenge', () => {
		const { game } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		clvq.lichessDeclineChallenge();
		expect(game.declineChallenge).not.toHaveBeenCalled();
	});

	test('calls declineChallenge with challenge id', () => {
		const { game, cbs } = mockLichessGame();
		const clvq = new Clvq({ lichessGame: game });
		cbs.challenge!({
			id: 'chal-3',
			challenger: { id: 'user3', username: 'Rival', rating: 1800 },
			destUser: null,
			timeControl: { type: 'clock', limit: 1800, increment: 20 },
			color: 'black',
			variant: { key: 'standard' },
		});
		clvq.lichessDeclineChallenge();
		expect(game.declineChallenge).toHaveBeenCalledWith('chal-3');
	});
});

// --- challenge callback DOM population ---

describe('Clvq challenge callback', () => {
	test('populates challenger name', () => {
		const { game, cbs } = mockLichessGame();
		new Clvq({ lichessGame: game });
		cbs.challenge!({
			id: 'chal-4',
			challenger: { id: 'user4', username: 'DeepBlue', rating: 2900 },
			destUser: null,
			timeControl: { type: 'clock', limit: 600, increment: 0 },
			color: 'random',
			variant: { key: 'standard' },
		});
		expect(document.getElementById('lichessChallengerName')?.textContent).toBe('DeepBlue');
	});

	test('populates challenger rating', () => {
		const { game, cbs } = mockLichessGame();
		new Clvq({ lichessGame: game });
		cbs.challenge!({
			id: 'chal-5',
			challenger: { id: 'user5', username: 'Player', rating: 1750 },
			destUser: null,
			timeControl: { type: 'clock', limit: 900, increment: 10 },
			color: 'random',
			variant: { key: 'standard' },
		});
		expect(document.getElementById('lichessChallengerRating')?.textContent).toBe('(1750)');
	});

	test('formats time control as M+I', () => {
		const { game, cbs } = mockLichessGame();
		new Clvq({ lichessGame: game });
		cbs.challenge!({
			id: 'chal-6',
			challenger: { id: 'user6', username: 'Swift', rating: 1600 },
			destUser: null,
			timeControl: { type: 'clock', limit: 900, increment: 10 },
			color: 'random',
			variant: { key: 'standard' },
		});
		expect(document.getElementById('lichessChallengeTimeCtrl')?.textContent).toBe('15+10');
	});
});

// --- gameStart / gameFinish callbacks ---

describe('Clvq game start/finish callbacks', () => {
	test('shows actions bar on game start', () => {
		const { game, cbs } = mockLichessGame();
		new Clvq({ lichessGame: game });
		cbs.gameStart!('game-live');
		expect(document.getElementById('gameActionsBar')?.style.display).toBe('');
	});

	test('hides actions bar on game finish', () => {
		const { game, cbs } = mockLichessGame();
		new Clvq({ lichessGame: game });
		cbs.gameStart!('game-live');
		cbs.gameFinish!('game-live');
		expect(document.getElementById('gameActionsBar')?.style.display).toBe('none');
	});
});

// --- gameFull callback ---

describe('Clvq gameFull callback', () => {
	test('sets white player name and rating', () => {
		const { game, cbs } = mockLichessGame();
		new Clvq({ lichessGame: game });
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
		const { game, cbs } = mockLichessGame();
		new Clvq({ lichessGame: game });
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
