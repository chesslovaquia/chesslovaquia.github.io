// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { vi, test, expect, beforeEach, afterEach, describe } from 'vitest';

import { mockConfigGameUI } from '../testing';
import { mockGameDeps     } from '../testing';
import { TestGameConfig   } from '../testing';

import { GamePromotion } from '../../game/GamePromotion';
import { GameMove      } from '../../game/GameMove';
import { GameDisplay   } from '../../game/GameDisplay';

import { ElementIds } from '../../clvq/ElementIds';

let cfg: TestGameConfig;

beforeEach(() => {
	document.body.innerHTML = mockConfigGameUI() + `
		<div id="white${ElementIds.pawnPromotion}" style="display:none">
			<span class="clvq-promotion-piece" data-piece="q"></span>
			<span class="clvq-promotion-piece" data-piece="r"></span>
			<span class="clvq-promotion-piece" data-piece="b"></span>
			<span class="clvq-promotion-piece" data-piece="n"></span>
		</div>
		<div id="black${ElementIds.pawnPromotion}" style="display:none">
			<span class="clvq-promotion-piece" data-piece="q"></span>
			<span class="clvq-promotion-piece" data-piece="r"></span>
			<span class="clvq-promotion-piece" data-piece="b"></span>
			<span class="clvq-promotion-piece" data-piece="n"></span>
		</div>
	`;
	cfg = new TestGameConfig();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('GamePromotion', () => {
	function newPromotion(cfg: TestGameConfig): GamePromotion {
		const deps = mockGameDeps(cfg);
		const move = new GameMove(deps.engine, deps.board);
		const display = new GameDisplay(deps.cfg, deps.engine, move);
		return new GamePromotion(deps.state, move, display, deps.nav);
	}

	test('showModal displays the modal', () => {
		const promotion = newPromotion(cfg);
		(promotion as any).showModal('white', vi.fn());
		const modal = document.getElementById(`white${ElementIds.pawnPromotion}`);
		expect(modal?.style.display).toBe('block');
	});

	test('valid piece triggers callback and hides modal', () => {
		const promotion = newPromotion(cfg);
		const callback = vi.fn();
		(promotion as any).showModal('white', callback);
		const piece = document.querySelector(`#white${ElementIds.pawnPromotion} .clvq-promotion-piece[data-piece="q"]`) as HTMLElement;
		piece.click();
		expect(callback).toHaveBeenCalledWith('q');
		const modal = document.getElementById(`white${ElementIds.pawnPromotion}`);
		expect(modal?.style.display).toBe('none');
	});

	test('invalid piece data does not trigger callback', () => {
		const promotion = newPromotion(cfg);
		const callback = vi.fn();
		(promotion as any).showModal('white', callback);
		const modal = document.getElementById(`white${ElementIds.pawnPromotion}`)!;
		// Simulate a click on an element with an invalid piece value
		const badElem = document.createElement('span');
		badElem.classList.add('clvq-promotion-piece');
		badElem.dataset.piece = 'x';
		modal.appendChild(badElem);
		badElem.click();
		expect(callback).not.toHaveBeenCalled();
	});

	test('listener is removed after piece selection (no accumulation)', () => {
		const promotion = newPromotion(cfg);
		const callback = vi.fn();
		// Register modal listener twice (simulates two promotions)
		(promotion as any).showModal('white', callback);
		const piece = document.querySelector(`#white${ElementIds.pawnPromotion} .clvq-promotion-piece[data-piece="q"]`) as HTMLElement;
		piece.click();
		expect(callback).toHaveBeenCalledTimes(1);
		// Re-show and click again — should fire exactly once more
		(promotion as any).showModal('white', callback);
		piece.click();
		expect(callback).toHaveBeenCalledTimes(2);
	});
});
