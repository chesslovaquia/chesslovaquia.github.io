<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Board from './components/Board.svelte';
  import Clock from './components/Clock.svelte';
  import MoveList from './components/MoveList.svelte';
  import GameBar from './components/GameBar.svelte';
  import { Engine } from './lib/engine';
  import type { GameStatus } from './lib/engine';
  import { createClock, tick, applyIncrement, isExpired } from './lib/clock';
  import type { ClockState } from './lib/clock';
  import { loadGameState, saveGameState, clearGameState } from './lib/game-state';
  import { saveGame } from './lib/games';
  import { classifyTimeControl } from './lib/time-control';
  import type { TimeControl } from './lib/time-control';
  import { cgColor } from './lib/color';
  import { LS_ACTIVE_GAME } from './lib/config';
  import type { Account } from './lib/accounts';
  import { logger } from './lib/logger';

  interface ActiveGameConfig {
    whiteAccountId: string;
    blackAccountId: string;
    orientation: 'white' | 'black';
    timeControl: TimeControl | null;
  }

  // --- Game state ---
  const engine = new Engine();
  let orientation: 'white' | 'black' = 'white';
  let whiteAccountId = '';
  let blackAccountId = '';
  let timeControl: TimeControl | null = null;
  let clockState: ClockState | null = null;
  let moves: string[] = [];
  let fenHistory: string[] = [engine.fen()];
  let currentMoveIndex = -1;   // -1 = before game start
  let gameStatus: GameStatus = 'in_progress';

  // Account display names (loaded on mount)
  let accounts = new Map<string, Account>();

  // Clock interval handle
  let clockInterval: ReturnType<typeof setInterval> | null = null;

  $: liveIndex = moves.length - 1;
  $: atLivePosition = currentMoveIndex === liveIndex;

  $: boardFen = fenHistory[currentMoveIndex + 1] ?? engine.fen();

  $: turn = engine.turn();
  $: movableColor =
    gameStatus !== 'in_progress' || !atLivePosition
      ? null
      : cgColor(turn);

  $: dests = gameStatus === 'in_progress' && atLivePosition
    ? engine.legalMoves()
    : null;

  $: lastMovePair = currentMoveIndex >= 0
    ? ((): [string, string] | null => {
        // Get last move as [from, to] from verbose history at this index.
        // We track this separately.
        return lastMovePairs[currentMoveIndex] ?? null;
      })()
    : null;

  let lastMovePairs: Array<[string, string]> = [];

  $: topColor = orientation === 'white' ? 'black' : 'white';
  $: bottomColor = orientation;
  $: topAccountId = topColor === 'white' ? whiteAccountId : blackAccountId;
  $: bottomAccountId = bottomColor === 'white' ? whiteAccountId : blackAccountId;
  $: topLabel = accounts.get(topAccountId)?.displayName ?? topColor;
  $: bottomLabel = accounts.get(bottomAccountId)?.displayName ?? bottomColor;

  $: topClockMs = clockState ? (topColor === 'white' ? clockState.white : clockState.black) : null;
  $: bottomClockMs = clockState ? (bottomColor === 'white' ? clockState.white : clockState.black) : null;
  $: clockActive = gameStatus === 'in_progress';

  function startClock() {
    if (!timeControl || !clockState) return;
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(() => {
      if (!clockState || gameStatus !== 'in_progress') return;
      const activeSide = cgColor(engine.turn());
      const now = Date.now();
      clockState = tick(clockState, activeSide, now);
      if (isExpired(clockState, activeSide)) {
        clockState = activeSide === 'white'
          ? { ...clockState, white: 0 }
          : { ...clockState, black: 0 };
        endGame(activeSide === 'white' ? 'black' : 'white', 'flag');
      }
    }, 100);
  }

  function stopClock() {
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  }

  function endGame(winner: 'white' | 'black' | null, _reason: string) {
    stopClock();
    if (winner === null) {
      // draw — status set by caller
    } else if (_reason === 'flag') {
      // The side that flagged lost
      const loser = winner === 'white' ? 'black' : 'white';
      engine.resign(loser);
    }
    gameStatus = engine.status();
    persistAndSaveGame();
  }

  async function persistAndSaveGame() {
    await clearGameState();
    const result = engine.result();
    if (result === '*') return; // aborted — don't save
    await saveGame({
      id: crypto.randomUUID(),
      source: 'otb',
      sourceGameId: null,
      whiteAccountId,
      blackAccountId,
      pgn: engine.pgn(),
      result,
      timeControlBucket: timeControl ? classifyTimeControl(timeControl) : 'classical',
      timeControlRaw: timeControl,
      openingEco: null,
      playedAt: Date.now(),
      importedAt: Date.now(),
    });
  }

  async function persistGameState() {
    if (gameStatus !== 'in_progress') return;
    await saveGameState({
      gameId: crypto.randomUUID(),
      moves,
      fen: engine.fen(),
      clock: clockState ? { ...clockState } : null,
      orientation,
      whiteAccountId,
      blackAccountId,
      timeControl,
    });
  }

  function handleMove(orig: string, dest: string, promotion?: string) {
    if (gameStatus !== 'in_progress') return;
    try {
      const moveObj: { from: string; to: string; promotion?: string } = { from: orig, to: dest };
      if (promotion) moveObj.promotion = promotion;
      const result = engine.move(moveObj);
      lastMovePairs = [...lastMovePairs, [result.from, result.to]];
      moves = engine.history();
      fenHistory = [...fenHistory, engine.fen()];
      currentMoveIndex = liveIndex;

      // Clock: apply increment to the side that just moved, then start for next side
      if (clockState && timeControl) {
        const movedSide = result.color === 'w' ? 'white' : 'black';
        clockState = applyIncrement(clockState, movedSide, timeControl);
        clockState = { ...clockState, lastTickAt: Date.now() };
      }

      const newStatus = engine.status();
      if (newStatus !== 'in_progress') {
        gameStatus = newStatus;
        endGame(null, 'chess');
      } else {
        persistGameState().catch((err: unknown) => logger.error('persist state', err));
      }
    } catch (err) {
      logger.error('illegal move', err);
    }
  }

  function handleNavigate(index: number) {
    currentMoveIndex = Math.max(-1, Math.min(index, liveIndex));
  }

  async function handleResign() {
    const side = cgColor(engine.turn());
    engine.resign(side);
    gameStatus = engine.status();
    await endGame(null, 'resign');
  }

  async function handleAbort() {
    engine.abort();
    gameStatus = engine.status();
    stopClock();
    await clearGameState();
  }

  async function handleOfferDraw() {
    if (window.confirm('Both players agree to a draw?')) {
      engine.agreeDraw();
      gameStatus = engine.status();
      await endGame(null, 'draw');
    }
  }

  function handleNewGame() {
    window.location.href = '/';
  }

  async function loadGame() {
    // Try to restore in-progress game
    const saved = await loadGameState();
    if (saved) {
      orientation = saved.orientation;
      whiteAccountId = saved.whiteAccountId;
      blackAccountId = saved.blackAccountId;
      timeControl = saved.timeControl;
      engine.reset();
      for (const san of saved.moves) {
        engine.move(san);
      }
      moves = engine.history();
      // Rebuild fen history and lastMovePairs from PGN replay
      rebuildHistory();
      currentMoveIndex = liveIndex;
      if (saved.clock) {
        clockState = { ...saved.clock, lastTickAt: Date.now() };
      } else if (timeControl) {
        clockState = createClock(timeControl);
      }
      if (timeControl && clockState) startClock();
      return;
    }

    // Fresh game from config
    const raw = localStorage.getItem(LS_ACTIVE_GAME);
    if (!raw) {
      window.location.href = '/';
      return;
    }
    const config = JSON.parse(raw) as ActiveGameConfig;
    localStorage.removeItem(LS_ACTIVE_GAME);
    orientation = config.orientation;
    whiteAccountId = config.whiteAccountId;
    blackAccountId = config.blackAccountId;
    timeControl = config.timeControl;
    engine.reset();
    moves = [];
    fenHistory = [engine.fen()];
    lastMovePairs = [];
    currentMoveIndex = -1;
    if (timeControl) {
      clockState = createClock(timeControl);
      startClock();
    }
  }

  function rebuildHistory() {
    const tmp = new Engine();
    fenHistory = [tmp.fen()];
    lastMovePairs = [];
    for (const san of moves) {
      const m = tmp.move(san);
      fenHistory = [...fenHistory, tmp.fen()];
      lastMovePairs = [...lastMovePairs, [m.from, m.to]];
    }
  }

  async function loadAccounts() {
    const { getAllAccounts } = await import('./lib/accounts');
    const all = await getAllAccounts();
    accounts = new Map(all.map((a) => [a.id, a]));
  }

  onMount(async () => {
    await loadAccounts();
    await loadGame();
  });

  onDestroy(() => {
    stopClock();
  });

  function resultLabel(status: GameStatus): string {
    if (status === 'checkmate') {
      const winner = engine.turn() === 'w' ? 'Black' : 'White';
      return `${winner} wins by checkmate`;
    }
    if (status === 'stalemate') return 'Draw by stalemate';
    if (status === 'draw') return 'Draw';
    if (status === 'resigned') {
      const r = engine.result();
      return r === '1-0' ? 'White wins (resignation)' : 'Black wins (resignation)';
    }
    if (status === 'aborted') return 'Game aborted';
    return '';
  }
</script>

<div class="play-layout">
  <!-- Top player (opponent) -->
  <div class="top-player">
    <span class="player-name">{topLabel}</span>
    {#if topClockMs !== null}
      <Clock ms={topClockMs} active={clockActive && cgColor(engine.turn()) === topColor} label="" />
    {/if}
  </div>

  <!-- Board -->
  <div class="board-area">
    <Board
      fen={boardFen}
      {orientation}
      {movableColor}
      {dests}
      lastMove={lastMovePair}
      viewOnly={!atLivePosition || gameStatus !== 'in_progress'}
      onMove={handleMove}
    />
    {#if gameStatus !== 'in_progress'}
      <div class="game-over-banner">
        <span>{resultLabel(gameStatus)}</span>
        <button on:click={handleNewGame}>New Game</button>
      </div>
    {/if}
  </div>

  <!-- Bottom player (self) -->
  <div class="bottom-player">
    <span class="player-name">{bottomLabel}</span>
    {#if bottomClockMs !== null}
      <Clock ms={bottomClockMs} active={clockActive && cgColor(engine.turn()) === bottomColor} label="" />
    {/if}
  </div>

  <!-- Info panel: move list + game bar -->
  <div class="info-panel">
    <div class="move-list-wrap">
      <MoveList
        {moves}
        currentIndex={currentMoveIndex}
        on:select={(e) => handleNavigate(e.detail)}
      />
    </div>
    <GameBar
      status={gameStatus}
      moveCount={moves.length}
      on:resign={handleResign}
      on:offerdraw={handleOfferDraw}
      on:abort={handleAbort}
      on:newgame={handleNewGame}
    />
    <div class="nav-row">
      <button on:click={() => handleNavigate(-1)} disabled={currentMoveIndex <= -1}>⏮</button>
      <button on:click={() => handleNavigate(currentMoveIndex - 1)} disabled={currentMoveIndex <= -1}>◀</button>
      <button on:click={() => handleNavigate(currentMoveIndex + 1)} disabled={atLivePosition}>▶</button>
      <button on:click={() => handleNavigate(liveIndex)} disabled={atLivePosition}>⏭</button>
    </div>
  </div>
</div>

<style>
  .play-layout {
    display: grid;
    grid-template-areas:
      "top"
      "board"
      "bottom"
      "info";
    grid-template-rows: auto 1fr auto auto;
    height: 100dvh;
    max-width: 600px;
    margin: 0 auto;
    padding: 0.5rem;
    gap: 0.4rem;
    box-sizing: border-box;
  }

  @media (orientation: landscape) and (min-width: 700px) {
    .play-layout {
      grid-template-areas:
        "top    info"
        "board  info"
        "bottom info";
      grid-template-columns: 1fr 280px;
      grid-template-rows: auto 1fr auto;
      max-width: none;
      height: 100dvh;
    }
  }

  .top-player    { grid-area: top; }
  .board-area    { grid-area: board; position: relative; }
  .bottom-player { grid-area: bottom; }
  .info-panel    { grid-area: info; display: flex; flex-direction: column; gap: 0.25rem; min-height: 0; }

  .top-player,
  .bottom-player {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .player-name {
    font-size: 0.9rem;
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .move-list-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .nav-row {
    display: flex;
    gap: 0.25rem;
  }

  .nav-row button {
    padding: 0.3rem 0.5rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-fg);
    cursor: pointer;
    font-size: 0.9rem;
  }

  .nav-row button:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .game-over-banner {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.75rem;
    font-size: 0.9rem;
    gap: 0.75rem;
  }

  .game-over-banner button {
    background: none;
    border: 1px solid var(--clvq-accent-green);
    border-radius: 4px;
    color: var(--clvq-accent-green);
    padding: 0.3rem 0.75rem;
    cursor: pointer;
    font-size: 0.85rem;
    white-space: nowrap;
  }
</style>
