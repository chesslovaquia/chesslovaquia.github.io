// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { readFileSync } from 'fs';

import { test, describe, expect, beforeEach } from 'vitest';

import { ConfigError  } from '../../config/ConfigError';
import { ConfigGameUI } from '../../config/ConfigGameUI';

import { mockConfigGameUI } from '../testing';

import { Window } from 'happy-dom';

const window = new Window({
	settings: {
		disableJavaScriptFileLoading: true,
		disableCSSFileLoading: true,
		disableComputedStyleRendering: true,
	}
});

global.document = window.document as any;

function uiTest(kind: string): void {
	test(kind, () => {
		const fn = `public/play/${kind}/index.html`;
		console.debug('ui:', fn);
		document.body.innerHTML = readFileSync(fn, 'utf8');
		const board = document.getElementById('chessboard');
		expect(board).not.toBe(null);
		const cfg = new ConfigGameUI(board as HTMLElement);
		expect(cfg.board.id).toBe('chessboard');
		expect(cfg.player1.info?.id).toBe('gamePlayer1');
		expect(cfg.player1.clock?.id).toBe('gameClock1');
		expect(cfg.player1.material?.id).toBe('gameMaterial1');
		expect(cfg.player1.materialCount?.id).toBe('gameMaterialCount1');
		expect(cfg.player2.info?.id).toBe('gamePlayer2');
		expect(cfg.player2.clock?.id).toBe('gameClock2');
		expect(cfg.player2.material?.id).toBe('gameMaterial2');
		expect(cfg.player2.materialCount?.id).toBe('gameMaterialCount2');
		expect(cfg.description?.id).toBe('gameDescription');
		expect(cfg.status?.id).toBe('gameStatus');
		expect(cfg.outcome?.id).toBe('gameOutcome');
		expect(cfg.gameReset?.id).toBe('gameReset');
		expect(cfg.navBackward?.id).toBe('gameNavBackward');
		expect(cfg.navForward?.id).toBe('gameNavForward');
		expect(cfg.flipBoard?.id).toBe('gameFlipBoard');
		expect(cfg.navFirstMove?.id).toBe('gameNavFirstMove');
		expect(cfg.navLastMove?.id).toBe('gameNavLastMove');
	});
}

uiTest('mobile');
uiTest('desktop');
