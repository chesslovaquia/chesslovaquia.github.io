<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import Board from './components/Board.svelte';
  import { getGame } from './lib/games';
  import { getAllAccounts } from './lib/accounts';
  import { Engine } from './lib/engine';
  import { OTB_USER_ID } from './lib/config';
  import type { Game } from './lib/games';
  import type { Account } from './lib/accounts';

  let game: Game | null = null;
  let error: string | null = null;
  let accounts = new Map<string, Account>();

  let moves: string[] = [];
  let fens: string[] = [];
  let lastMoves: ([string, string] | null)[] = [];
  let checks: (false | 'white' | 'black')[] = [];
  let currentIndex = 0;
  let orientation: 'white' | 'black' = 'white';

  $: topColor    = orientation === 'white' ? 'black' : 'white';
  $: bottomColor = orientation;
  $: topName    = game ? (topColor    === 'white' ? accountName(game.whiteAccountId) : accountName(game.blackAccountId)) : '';
  $: bottomName = game ? (bottomColor === 'white' ? accountName(game.whiteAccountId) : accountName(game.blackAccountId)) : '';

  $: currentFen       = fens[currentIndex]      ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  $: currentLastMove  = lastMoves[currentIndex] ?? null;
  $: currentCheck     = checks[currentIndex]    ?? false;

  afterUpdate(() => {
    document.getElementById(`move-${currentIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  onMount(async () => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (!id) { error = 'No game ID in URL'; return; }

    const [g, allAccounts] = await Promise.all([getGame(id), getAllAccounts()]);
    if (!g) { error = 'Game not found'; return; }

    game = g;
    accounts = new Map(allAccounts.map((a) => [a.id, a]));

    orientation = g.source === 'otb'
      ? (g.whiteAccountId === OTB_USER_ID ? 'white' : 'black')
      : (accounts.has(g.whiteAccountId) ? 'white' : 'black');

    const parser = new Engine();
    parser.loadPgn(g.pgn);
    moves = parser.history();

    const replay = new Engine();
    const f:  string[]                        = [replay.fen()];
    const lm: ([string, string] | null)[]     = [null];
    const ch: (false | 'white' | 'black')[]   = [false];

    for (const san of moves) {
      const mv = replay.move(san);
      f.push(replay.fen());
      lm.push([mv.from, mv.to]);
      ch.push(replay.isCheck() ? (replay.turn() === 'w' ? 'white' : 'black') : false);
    }

    fens      = f;
    lastMoves = lm;
    checks    = ch;
    currentIndex = moves.length;
  });

  function goFirst() { currentIndex = 0; }
  function goPrev()  { if (currentIndex > 0)            currentIndex--; }
  function goNext()  { if (currentIndex < moves.length)  currentIndex++; }
  function goLast()  { currentIndex = moves.length; }

  function handleKey(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goPrev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    else if (e.key === 'Home') { e.preventDefault(); goFirst(); }
    else if (e.key === 'End')  { e.preventDefault(); goLast(); }
  }

  function accountName(id: string): string {
    if (id.startsWith('lichess:')) return id.slice('lichess:'.length);
    return accounts.get(id)?.displayName ?? '?';
  }

  function resultLabel(result: Game['result']): string {
    if (result === '1/2-1/2') return '½–½';
    if (result === '1-0') return '1–0';
    if (result === '0-1') return '0–1';
    return '–';
  }
</script>

<svelte:window on:keydown={handleKey} />

<div class="play-layout">
  <!-- Top player (opponent) -->
  <div class="top-player">
    <span class="color-dot" data-color={topColor}></span>
    <span class="player-name">{topName}</span>
    {#if game}<span class="result-text">{resultLabel(game.result)}</span>{/if}
  </div>

  <!-- Board -->
  <div class="board-area">
    {#if error}
      <p class="status-msg">{error}</p>
    {:else if fens.length === 0}
      <p class="status-msg">Loading…</p>
    {:else}
      <Board
        fen={currentFen}
        {orientation}
        movableColor={null}
        dests={null}
        lastMove={currentLastMove}
        check={currentCheck}
        viewOnly={true}
        onMove={() => {}}
      />
    {/if}
  </div>

  <!-- Bottom player (self / orientation side) -->
  <div class="bottom-player">
    <span class="color-dot" data-color={bottomColor}></span>
    <span class="player-name">{bottomName}</span>
  </div>

  <!-- Info panel: back link + nav buttons + move list -->
  <div class="info-panel">
    <div class="nav-row">
      <a href="/history/" class="action-btn" title="Back to History">←</a>
      <button class="action-btn" on:click={goFirst} disabled={currentIndex === 0}       title="First move">⏮</button>
      <button class="action-btn" on:click={goPrev}  disabled={currentIndex === 0}       title="Previous move">◀</button>
      <button class="action-btn" on:click={goNext}  disabled={currentIndex === moves.length} title="Next move">▶</button>
      <button class="action-btn" on:click={goLast}  disabled={currentIndex === moves.length} title="Last move">⏭</button>
    </div>
    <div class="move-list">
      {#each { length: Math.ceil(moves.length / 2) } as _, i}
        {@const wi = i * 2 + 1}
        {@const bi = i * 2 + 2}
        <div class="move-pair">
          <span class="move-num">{i + 1}.</span>
          <button
            id="move-{wi}"
            class="move-san"
            class:active={currentIndex === wi}
            on:click={() => (currentIndex = wi)}
          >{moves[wi - 1]}</button>
          {#if bi <= moves.length}
            <button
              id="move-{bi}"
              class="move-san"
              class:active={currentIndex === bi}
              on:click={() => (currentIndex = bi)}
            >{moves[bi - 1]}</button>
          {/if}
        </div>
      {/each}
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
    height: var(--clvq-vh);
    gap: 0.4rem;
    box-sizing: border-box;
  }

  .top-player    { grid-area: top; }
  .board-area    { grid-area: board; position: relative; container-type: size; display: flex; align-items: center; justify-content: center; }
  .bottom-player { grid-area: bottom; }
  .info-panel    { grid-area: info; display: flex; flex-direction: column; overflow: hidden; }

  .top-player,
  .bottom-player {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0 0.5rem;
  }

  .player-name {
    font-size: 0.9rem;
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .result-text {
    font-size: 0.75rem;
    color: var(--clvq-muted);
    flex-shrink: 0;
  }

  .color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid var(--clvq-border);
    flex-shrink: 0;
  }

  .color-dot[data-color="white"] { background: #f0d9b5; }
  .color-dot[data-color="black"] { background: #b58863; }

  .nav-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.3rem 0;
    flex-shrink: 0;
  }

  .action-btn {
    width: 2.2rem;
    height: 2.2rem;
    padding: 0;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-fg);
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    text-decoration: none;
  }

  .action-btn:hover    { background: var(--clvq-surface-hover); }
  .action-btn:disabled { opacity: 0.3; cursor: default; }
  .action-btn:focus-visible { outline: 2px solid var(--clvq-accent); outline-offset: 2px; }

  /* Portrait: move list has a capped height so the board keeps most of the screen */
  .move-list {
    overflow-y: auto;
    max-height: 8rem;
    padding: 0 0.5rem 0.3rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .move-pair {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .move-num {
    color: var(--clvq-muted);
    font-size: 0.75rem;
    min-width: 1.8rem;
    text-align: right;
    flex-shrink: 0;
  }

  .move-san {
    background: none;
    border: 1px solid transparent;
    border-radius: var(--clvq-radius-sm);
    color: var(--clvq-fg);
    font-size: 0.85rem;
    padding: 0.1rem 0.3rem;
    cursor: pointer;
    min-width: 3rem;
    text-align: left;
  }

  .move-san:hover   { background: var(--clvq-surface-hover); }
  .move-san.active  { background: var(--clvq-accent); color: #000; font-weight: 600; }
  .move-san:focus-visible { outline: 2px solid var(--clvq-accent); outline-offset: 1px; }

  .status-msg {
    color: var(--clvq-muted);
    font-size: 0.9rem;
  }

  @media (orientation: landscape) and (min-width: 700px) {
    .play-layout {
      grid-template-areas: "top board bottom info";
      grid-template-columns: auto 1fr auto auto;
      grid-template-rows: 1fr;
      max-width: none;
      height: var(--clvq-vh);
      padding: 0;
    }

    .top-player,
    .bottom-player {
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 0 0.4rem;
      gap: 0.4rem;
    }

    .info-panel {
      min-width: 8rem;
      padding: 0.35rem 0.2rem;
    }

    /* Landscape: nav buttons stack vertically like Play.svelte's action buttons */
    .nav-row {
      flex-direction: column;
      padding: 0;
      justify-content: flex-start;
    }

    /* Landscape: move list fills remaining column height */
    .move-list {
      max-height: none;
      flex: 1;
      min-height: 0;
    }
  }
</style>
