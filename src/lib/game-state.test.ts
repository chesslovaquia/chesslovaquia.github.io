// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { describe, it, expect, beforeEach } from 'vitest';
import { saveGameState, loadGameState, clearGameState } from './game-state';
import type { GameState } from './game-state';

function makeState(): Omit<GameState, 'id'> {
  return {
    gameId: 'test-game-id',
    moves: ['e4', 'e5'],
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    clock: { white: 290_000, black: 295_000, lastTickAt: Date.now() },
    orientation: 'white',
    whiteAccountId: 'w1',
    blackAccountId: 'b1',
    timeControl: { initialSec: 300, incrementSec: 0 },
  };
}

describe('game-state store', () => {
  beforeEach(async () => {
    await clearGameState();
  });

  it('loadGameState returns undefined when empty', async () => {
    const state = await loadGameState();
    expect(state).toBeUndefined();
  });

  it('saveGameState persists and loadGameState retrieves', async () => {
    await saveGameState(makeState());
    const state = await loadGameState();
    expect(state).toBeDefined();
    expect(state?.gameId).toBe('test-game-id');
    expect(state?.moves).toEqual(['e4', 'e5']);
  });

  it('clearGameState removes the record', async () => {
    await saveGameState(makeState());
    await clearGameState();
    const state = await loadGameState();
    expect(state).toBeUndefined();
  });

  it('saveGameState overwrites previous state', async () => {
    await saveGameState(makeState());
    await saveGameState({ ...makeState(), moves: ['d4', 'd5'] });
    const state = await loadGameState();
    expect(state?.moves).toEqual(['d4', 'd5']);
  });
});
