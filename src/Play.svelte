<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import NavMenu from './components/NavMenu.svelte';
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
  import { LichessClient } from './lib/lichess/client';
  import {
    getActiveGame,
    clearActiveGame,
    persistActiveGame,
    streamGame,
    makeMove as lichessMakeMove,
    resign as lichessResign,
    abort as lichessAbort,
    parseUci,
    toUci,
    isTerminalStatus,
  } from './lib/lichess/play';
  import type { LichessGameFull, LichessGameStateEvent, LichessPlayer } from './lib/lichess/play';

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
  let currentMoveIndex = -1;
  let gameStatus: GameStatus = 'in_progress';
  let confirmingDraw = false;

  // Account display names
  let accounts = new Map<string, Account>();

  // Clock interval handle
  let clockInterval: ReturnType<typeof setInterval> | null = null;

  // --- Lichess mode ---
  let lichessMode = false;
  let lichessClient: LichessClient | null = null;
  let lichessGameId = '';
  /** Our color in a lichess game. */
  let playerColor: 'white' | 'black' = 'white';
  /** Opponent info from gameFull. */
  let opponent: LichessPlayer | null = null;
  /** Space-separated UCI moves as received from the lichess game stream. */
  let lichessUciMoves: string[] = [];
  /** Cancel function for the game stream. */
  let cancelStream: (() => void) | null = null;
  /** True while we're waiting for the gameFull event on reconnect. */
  let lichessConnecting = true;

  $: liveIndex = moves.length - 1;
  $: atLivePosition = currentMoveIndex === liveIndex;
  $: boardFen = fenHistory[currentMoveIndex + 1] ?? engine.fen();

  let turn: 'w' | 'b' = engine.turn();
  let legalDests: Map<string, string[]> = engine.legalMoves();

  function syncFromEngine() {
    turn = engine.turn();
    legalDests = gameStatus === 'in_progress' ? engine.legalMoves() : new Map();
  }

  // In lichess mode, only allow moving our own pieces on our turn.
  $: movableColor = (() => {
    if (gameStatus !== 'in_progress' || !atLivePosition) return null;
    if (lichessMode) {
      return cgColor(turn) === playerColor ? playerColor : null;
    }
    return cgColor(turn);
  })();

  $: dests = gameStatus === 'in_progress' && atLivePosition ? legalDests : null;

  $: lastMovePair = currentMoveIndex >= 0
    ? (lastMovePairs[currentMoveIndex] ?? null)
    : null;

  let lastMovePairs: Array<[string, string]> = [];

  $: topColor = orientation === 'white' ? 'black' : 'white';
  $: bottomColor = orientation;
  $: topAccountId = topColor === 'white' ? whiteAccountId : blackAccountId;
  $: bottomAccountId = bottomColor === 'white' ? whiteAccountId : blackAccountId;

  // In lichess mode, show opponent's name from the game stream for the top player.
  $: topLabel = (() => {
    if (lichessMode && opponent) {
      const opponentIsTop = topColor !== playerColor;
      if (opponentIsTop) return opponent.rating ? `${opponent.name} (${opponent.rating})` : opponent.name;
    }
    return accounts.get(topAccountId)?.displayName ?? topColor;
  })();
  $: bottomLabel = (() => {
    if (lichessMode) {
      const account = accounts.get(bottomAccountId);
      return account?.displayName ?? bottomColor;
    }
    return accounts.get(bottomAccountId)?.displayName ?? bottomColor;
  })();

  $: topClockMs = clockState ? (topColor === 'white' ? clockState.white : clockState.black) : null;
  $: bottomClockMs = clockState ? (bottomColor === 'white' ? clockState.white : clockState.black) : null;
  $: clockActive = gameStatus === 'in_progress';

  // --- Clock ---

  function startClock() {
    if (!timeControl || !clockState) return;
    if (clockInterval) clearInterval(clockInterval);
    clockInterval = setInterval(() => {
      if (!clockState || gameStatus !== 'in_progress') return;
      const activeSide = cgColor(turn);
      const now = Date.now();
      clockState = tick(clockState, activeSide, now);
      if (isExpired(clockState, activeSide)) {
        clockState = activeSide === 'white'
          ? { ...clockState, white: 0 }
          : { ...clockState, black: 0 };
        if (!lichessMode) {
          // Local flag only in OTB mode; lichess manages time in online mode
          endGame(activeSide === 'white' ? 'black' : 'white', 'flag');
        }
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
    confirmingDraw = false;
    stopClock();
    if (winner !== null && _reason === 'flag') {
      const loser = winner === 'white' ? 'black' : 'white';
      engine.resign(loser);
    }
    gameStatus = engine.status();
    if (!lichessMode) {
      persistAndSaveGame().catch((err: unknown) => logger.error('persist game', err));
    }
  }

  async function persistAndSaveGame() {
    await clearGameState();
    const result = engine.result();
    if (result === '*') return;
    await saveGame({
      id: crypto.randomUUID(),
      source: lichessMode ? 'lichess' : 'otb',
      sourceGameId: lichessMode ? lichessGameId : null,
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

  // --- Move handling ---

  function handleMove(orig: string, dest: string, promotion?: string) {
    if (gameStatus !== 'in_progress') return;
    try {
      const moveObj: { from: string; to: string; promotion?: string } = { from: orig, to: dest };
      if (promotion) moveObj.promotion = promotion;
      const result = engine.move(moveObj);
      lastMovePairs = [...lastMovePairs, [result.from, result.to]];
      moves = engine.history();
      fenHistory = [...fenHistory, engine.fen()];
      currentMoveIndex = moves.length - 1;

      // Clock: apply increment to the side that just moved
      if (clockState && timeControl && !lichessMode) {
        const movedSide = result.color === 'w' ? 'white' : 'black';
        clockState = applyIncrement(clockState, movedSide, timeControl);
        clockState = { ...clockState, lastTickAt: Date.now() };
      }

      if (lichessMode && lichessClient) {
        const uci = toUci(result.from, result.to, result.promotion);
        lichessUciMoves = [...lichessUciMoves, uci];
        lichessMakeMove(lichessClient, lichessGameId, uci).catch((err: unknown) =>
          logger.error('lichess make move', err)
        );
      }

      const newStatus = engine.status();
      if (newStatus !== 'in_progress') {
        gameStatus = newStatus;
        syncFromEngine();
        endGame(null, 'chess');
      } else {
        syncFromEngine();
        if (!lichessMode) {
          persistGameState().catch((err: unknown) => logger.error('persist state', err));
        }
      }
    } catch (err) {
      logger.error('illegal move', err);
    }
  }

  // --- Lichess game stream handlers ---

  function handleGameFull(event: LichessGameFull) {
    lichessConnecting = false;

    // Derive our account placement (white or black)
    const savedActive = getActiveGame();
    if (savedActive) {
      playerColor = savedActive.color;
    } else {
      playerColor = 'white'; // fallback
    }
    orientation = playerColor;

    // Set account IDs for display / save
    const ourAccountId = accounts.size > 0
      ? [...accounts.values()].find((a) => a.network === 'lichess')?.id ?? ''
      : '';
    if (playerColor === 'white') {
      whiteAccountId = ourAccountId;
      blackAccountId = `lichess:${event.black.name}`;
      opponent = event.black;
    } else {
      whiteAccountId = `lichess:${event.white.name}`;
      blackAccountId = ourAccountId;
      opponent = event.white;
    }

    // Set time control from game clock
    if (event.clock) {
      timeControl = {
        initialSec: Math.round(event.clock.initial / 1000),
        incrementSec: Math.round(event.clock.increment / 1000),
      };
    }

    // Replay all moves from the game state
    handleGameState(event.state);
  }

  function handleGameState(event: LichessGameStateEvent) {
    const uciList = event.moves ? event.moves.split(' ') : [];

    // Apply any moves not yet in our engine
    const newUci = uciList.slice(lichessUciMoves.length);
    for (const uci of newUci) {
      try {
        const parsed = parseUci(uci);
        const result = engine.move(parsed);
        lastMovePairs = [...lastMovePairs, [result.from, result.to]];
        fenHistory = [...fenHistory, engine.fen()];
      } catch (err) {
        logger.error('lichess apply move', uci, err);
      }
    }
    if (newUci.length > 0) {
      lichessUciMoves = uciList;
      moves = engine.history();
      currentMoveIndex = moves.length - 1;
      syncFromEngine();
    }

    // Sync server-authoritative clock
    if (event.wc !== undefined && event.bc !== undefined) {
      clockState = { white: event.wc, black: event.bc, lastTickAt: Date.now() };
      if (gameStatus === 'in_progress' && timeControl) startClock();
    }

    // Handle terminal status
    if (isTerminalStatus(event.status)) {
      stopClock();
      gameStatus = engine.status();
      if (gameStatus === 'in_progress') {
        // Lichess ended the game but our local engine doesn't reflect it yet.
        // Force a resigned status based on server winner.
        if (event.winner) {
          engine.resign(event.winner === 'white' ? 'black' : 'white');
        } else {
          engine.agreeDraw();
        }
        gameStatus = engine.status();
      }
      syncFromEngine();
      clearActiveGame();
      persistAndSaveGame().catch((err: unknown) => logger.error('persist lichess game', err));
    }
  }

  // --- Game actions ---

  function handleNavigate(index: number) {
    currentMoveIndex = Math.max(-1, Math.min(index, liveIndex));
  }

  function handleKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); handleNavigate(currentMoveIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); handleNavigate(currentMoveIndex + 1); }
    if (e.key === 'Home' || e.key === '0') { e.preventDefault(); handleNavigate(-1); }
    if (e.key === 'End')        { e.preventDefault(); handleNavigate(liveIndex); }
  }

  async function handleResign() {
    if (lichessMode && lichessClient) {
      try {
        await lichessResign(lichessClient, lichessGameId);
        // Stream will deliver the terminal gameState — don't update local state here
      } catch (err) {
        logger.error('lichess resign', err);
      }
    } else {
      engine.resign(cgColor(turn));
      gameStatus = engine.status();
      syncFromEngine();
      await endGame(null, 'resign');
    }
  }

  async function handleAbort() {
    if (lichessMode && lichessClient) {
      try {
        await lichessAbort(lichessClient, lichessGameId);
      } catch (err) {
        logger.error('lichess abort', err);
      }
    } else {
      engine.abort();
      gameStatus = engine.status();
      syncFromEngine();
      stopClock();
      await clearGameState();
    }
  }

  async function handleOfferDraw() {
    if (lichessMode) return;
    if (!confirmingDraw) {
      confirmingDraw = true;
      return;
    }
    confirmingDraw = false;
    engine.agreeDraw();
    gameStatus = engine.status();
    syncFromEngine();
    await endGame(null, 'draw');
  }

  function handleCancelDraw() {
    confirmingDraw = false;
  }

  function handleNewGame() {
    if (lichessMode) {
      clearActiveGame();
    }
    window.location.href = '/';
  }

  // --- Load / init ---

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

  async function loadGame() {
    // Check for active lichess game first
    const active = getActiveGame();
    if (active) {
      const account = [...accounts.values()].find((a) => a.id === active.accountId);
      if (account?.credentials?.accessToken) {
        lichessMode = true;
        lichessGameId = active.gameId;
        playerColor = active.color;
        orientation = playerColor;
        lichessClient = new LichessClient(account.credentials.accessToken);

        // Persist again to keep the active game alive (handles page refreshes)
        persistActiveGame(active);

        cancelStream = streamGame(
          lichessClient,
          lichessGameId,
          (e: LichessGameFull | LichessGameStateEvent) => {
            if (e.type === 'gameFull') {
              handleGameFull(e as LichessGameFull);
            } else if (e.type === 'gameState') {
              handleGameState(e as LichessGameStateEvent);
            }
          },
          (err: unknown) => logger.error('game stream error', err)
        );
        return;
      } else {
        // Active game found but account missing/no credentials — clear and fall through to OTB
        clearActiveGame();
      }
    }

    // Try to restore in-progress OTB game
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
      rebuildHistory();
      currentMoveIndex = moves.length - 1;
      syncFromEngine();
      if (saved.clock) {
        clockState = { ...saved.clock, lastTickAt: Date.now() };
      } else if (timeControl) {
        clockState = createClock(timeControl);
      }
      if (timeControl && clockState) startClock();
      return;
    }

    // Fresh OTB game from config
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
    syncFromEngine();
    if (timeControl) {
      clockState = createClock(timeControl);
      startClock();
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
    cancelStream?.();
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

<svelte:window on:keydown={handleKeydown} />

<div class="play-layout">
  <!-- Top player (opponent) -->
  <div class="top-player">
    <NavMenu />
    <span class="color-dot" data-color={topColor}></span>
    <span class="player-name">{topLabel}</span>
    {#if topClockMs !== null}
      <Clock ms={topClockMs} active={clockActive && cgColor(turn) === topColor} label="" />
    {/if}
  </div>

  <!-- Board -->
  <div class="board-area">
    {#if lichessMode && lichessConnecting}
      <div class="connecting-overlay">Connecting to lichess…</div>
    {/if}
    <Board
      fen={boardFen}
      {orientation}
      {movableColor}
      {dests}
      lastMove={lastMovePair}
      viewOnly={!atLivePosition || gameStatus !== 'in_progress'}
      onMove={handleMove}
    />
  </div>

  <!-- Bottom player (self) -->
  <div class="bottom-player">
    <span class="color-dot" data-color={bottomColor}></span>
    <span class="player-name">{bottomLabel}</span>
    {#if bottomClockMs !== null}
      <Clock ms={bottomClockMs} active={clockActive && cgColor(turn) === bottomColor} label="" />
    {/if}
  </div>

  <!-- Info panel: move list + game bar -->
  <div class="info-panel">
    {#if gameStatus !== 'in_progress'}
      <div class="game-over-banner">
        <span>{resultLabel(gameStatus)}</span>
        <button on:click={handleNewGame}>New Game</button>
      </div>
    {/if}
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
      {confirmingDraw}
      on:resign={handleResign}
      on:offerdraw={handleOfferDraw}
      on:canceldraw={handleCancelDraw}
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
  .board-area    { grid-area: board; position: relative; container-type: size; display: flex; align-items: center; justify-content: center; }
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-md);
    font-size: 0.9rem;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .game-over-banner button {
    background: none;
    border: 1px solid var(--clvq-accent);
    border-radius: 4px;
    color: var(--clvq-accent);
    padding: 0.3rem 0.75rem;
    cursor: pointer;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .connecting-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    z-index: 10;
    border-radius: var(--clvq-radius-md);
  }

  .color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid var(--clvq-border);
    flex-shrink: 0;
  }

  .color-dot[data-color="white"] {
    background: #f0d9b5;
  }

  .color-dot[data-color="black"] {
    background: #b58863;
  }
</style>
