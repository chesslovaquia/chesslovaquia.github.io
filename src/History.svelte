<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import BottomTabs from './components/BottomTabs.svelte';
  import { getAllGames } from './lib/games';
  import type { Game } from './lib/games';
  import { getAllAccounts } from './lib/accounts';
  import type { Account, Network } from './lib/accounts';
  import { OTB_USER_ID } from './lib/config';
  import { importUserGames as importLichessGames } from './lib/lichess/history';
  import { importUserGames as importChesscomGames } from './lib/chesscom/import';
  import { logger } from './lib/logger';

  let allGames: Game[] = [];
  let accounts = new Map<string, Account>();
  let syncableAccounts: Account[] = [];
  let loading = true;
  let syncStatus = new Map<string, string>(); // accountId → message

  let filterNetwork: 'all' | Network = 'all';
  let filterAccountId = 'all';

  onMount(async () => {
    await reload();
  });

  async function reload() {
    loading = true;
    const [games, allAccounts] = await Promise.all([getAllGames(), getAllAccounts()]);
    accounts = new Map(allAccounts.map((a) => [a.id, a]));
    allGames = games.sort((a, b) => b.playedAt - a.playedAt);
    syncableAccounts = allAccounts.filter(
      (a) => (a.network === 'lichess' && !!a.credentials) || (a.network === 'chesscom' && !!a.handle)
    );
    loading = false;
  }

  async function syncAccount(account: Account) {
    syncStatus = new Map(syncStatus).set(account.id, 'Syncing…');
    try {
      const count = account.network === 'chesscom'
        ? await importChesscomGames(account)
        : await importLichessGames(account);
      syncStatus = new Map(syncStatus).set(account.id, `${count} game${count === 1 ? '' : 's'} imported`);
      allGames = (await getAllGames()).sort((a, b) => b.playedAt - a.playedAt);
    } catch (err) {
      logger.error('history sync', err);
      syncStatus = new Map(syncStatus).set(account.id, 'Sync failed');
    }
  }

  function accountName(id: string): string {
    if (id.startsWith('lichess:')) return id.slice('lichess:'.length);
    if (id.startsWith('chesscom:')) return id.slice('chesscom:'.length);
    return accounts.get(id)?.displayName ?? '?';
  }

  $: games = allGames.filter((game) => {
    if (filterNetwork !== 'all' && game.source !== filterNetwork) return false;
    if (filterAccountId !== 'all' && game.whiteAccountId !== filterAccountId && game.blackAccountId !== filterAccountId) {
      return false;
    }
    return true;
  });

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function playerColor(game: Game): 'white' | 'black' {
    // For OTB games, check if we (User account) played white
    if (game.source === 'otb') {
      return game.whiteAccountId === OTB_USER_ID ? 'white' : 'black';
    }
    // For online games (Lichess, chess.com), check if white is our account
    return accounts.has(game.whiteAccountId) ? 'white' : 'black';
  }

  function resultClass(result: Game['result'], color: 'white' | 'black'): string {
    if (result === '1/2-1/2') return 'draw';
    if (result === '*') return 'aborted';
    const whiteWon = result === '1-0';
    const playerWon = color === 'white' ? whiteWon : !whiteWon;
    return playerWon ? 'win' : 'loss';
  }

  function resultLabel(result: Game['result'], color: 'white' | 'black'): string {
    if (result === '1/2-1/2') return '=';
    if (result === '*') return '×';
    const whiteWon = result === '1-0';
    const playerWon = color === 'white' ? whiteWon : !whiteWon;
    return playerWon ? '+' : '−';
  }
</script>

<div class="page-shell">
<main>
  <header>
    <h1>History</h1>
  </header>

  {#if syncableAccounts.length > 0}
    <section class="sync-section">
      {#each syncableAccounts as account (account.id)}
        <div class="sync-row">
          <span class="sync-label">{account.network} / {account.displayName}</span>
          <button
            class="sync-btn"
            on:click={() => syncAccount(account)}
            disabled={syncStatus.get(account.id) === 'Syncing…'}
          >
            {syncStatus.get(account.id) ?? 'Sync'}
          </button>
        </div>
      {/each}
    </section>
  {/if}

  {#if allGames.length > 0}
    <section class="filter-section">
      <select class="filter-select" bind:value={filterNetwork} aria-label="Filter by network">
        <option value="all">All networks</option>
        <option value="otb">OTB</option>
        <option value="lichess">Lichess</option>
        <option value="chesscom">Chess.com</option>
      </select>
      <select class="filter-select" bind:value={filterAccountId} aria-label="Filter by account">
        <option value="all">All accounts</option>
        {#each [...accounts.values()] as account (account.id)}
          <option value={account.id}>{account.network} / {account.displayName}</option>
        {/each}
      </select>
    </section>
  {/if}

  {#if loading}
    <p class="loading">Loading…</p>
  {:else if allGames.length === 0}
    <p class="empty">No games yet. <a href="/">Play one!</a></p>
  {:else if games.length === 0}
    <p class="empty">No games match the selected filters.</p>
  {:else}
    <ul class="game-list">
      {#each games as game (game.id)}
        <li class="game-row">
          <a class="game-row-link" href="/review/?id={game.id}">
            <span class="date">{formatDate(game.playedAt)}</span>
            <span class="players">
              <span class="player">{accountName(game.whiteAccountId)}</span>
              <span class="vs">vs</span>
              <span class="player">{accountName(game.blackAccountId)}</span>
            </span>
            <span class="game-meta">
              {#if game.source !== 'otb'}
                <span class="source">{game.source}</span>
              {/if}
              <span class="tc">{game.timeControlBucket}</span>
              <span class="result result-{resultClass(game.result, playerColor(game))}">
                {resultLabel(game.result, playerColor(game))}
              </span>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</main>
<BottomTabs />
</div>

<style>
  .page-shell {
    height: var(--clvq-vh);
    display: grid;
    grid-template-rows: 1fr auto;
    overflow: hidden;
  }
  main {
    min-height: 0;
    overflow-y: auto;
  }
  h1 {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0;
  }

  .sync-section {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    padding: 0.6rem 0.75rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-md);
  }

  .sync-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .sync-label {
    font-size: 0.85rem;
    color: var(--clvq-muted);
  }

  .sync-btn {
    background: none;
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-muted);
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .sync-btn:hover:not(:disabled) {
    border-color: var(--clvq-accent-blue);
    color: var(--clvq-accent-blue);
  }

  .sync-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .filter-section {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .filter-select {
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-sm);
    color: var(--clvq-fg);
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    flex: 1;
    min-width: 120px;
  }

  .filter-select:focus-visible {
    outline: 2px solid var(--clvq-accent);
    outline-offset: -2px;
  }

  .loading,
  .empty {
    color: var(--clvq-muted);
    font-size: 0.9rem;
  }

  .game-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .game-row {
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-md);
    font-size: 0.875rem;
  }

  .game-row-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    text-decoration: none;
    color: inherit;
    flex-wrap: wrap;
    border-radius: var(--clvq-radius-md);
  }

  .game-row-link:hover { background: var(--clvq-surface-hover); }
  .game-row-link:focus-visible { outline: 2px solid var(--clvq-accent); outline-offset: -2px; }

  .date {
    color: var(--clvq-muted);
    min-width: 7rem;
    font-size: 0.8rem;
  }

  .players {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
  }

  .player {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vs {
    color: var(--clvq-muted);
    font-size: 0.75rem;
    flex-shrink: 0;
  }

  .game-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
    flex-shrink: 0;
  }

  .result {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: var(--clvq-radius-sm);
    font-weight: 700;
    font-size: 0.75rem;
    color: #fff;
  }

  .result-win     { background: var(--clvq-accent-green); }
  .result-loss    { background: var(--clvq-accent-red); }
  .result-draw    { background: var(--clvq-muted); }
  .result-aborted { background: var(--clvq-muted); }

  .tc {
    color: var(--clvq-muted);
    font-size: 0.75rem;
  }

  .source {
    color: var(--clvq-accent-blue);
    font-size: 0.75rem;
  }
</style>
