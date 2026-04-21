<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import NavMenu from './components/NavMenu.svelte';
  import { getAllGames } from './lib/games';
  import type { Game } from './lib/games';
  import { getAllAccounts } from './lib/accounts';
  import type { Account } from './lib/accounts';
  import { importUserGames } from './lib/lichess/history';
  import { logger } from './lib/logger';

  let games: Game[] = [];
  let accounts = new Map<string, Account>();
  let lichessAccounts: Account[] = [];
  let loading = true;
  let syncStatus = new Map<string, string>(); // accountId → message

  onMount(async () => {
    await reload();
  });

  async function reload() {
    loading = true;
    const [allGames, allAccounts] = await Promise.all([getAllGames(), getAllAccounts()]);
    accounts = new Map(allAccounts.map((a) => [a.id, a]));
    games = allGames.sort((a, b) => b.playedAt - a.playedAt);
    lichessAccounts = allAccounts.filter((a) => a.network === 'lichess' && !!a.credentials);
    loading = false;
  }

  async function syncAccount(account: Account) {
    syncStatus = new Map(syncStatus).set(account.id, 'Syncing…');
    try {
      const count = await importUserGames(account);
      syncStatus = new Map(syncStatus).set(account.id, `${count} game${count === 1 ? '' : 's'} imported`);
      // Refresh game list
      const allGames = await getAllGames();
      games = allGames.sort((a, b) => b.playedAt - a.playedAt);
    } catch (err) {
      logger.error('history sync', err);
      syncStatus = new Map(syncStatus).set(account.id, 'Sync failed');
    }
  }

  function accountName(id: string): string {
    if (id.startsWith('lichess:')) return id.slice('lichess:'.length);
    return accounts.get(id)?.displayName ?? '?';
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function resultClass(result: Game['result']): string {
    if (result === '1/2-1/2') return 'draw';
    if (result === '*') return 'aborted';
    if (result === '1-0') return 'win';
    if (result === '0-1') return 'loss';
    return 'aborted';
  }

  function resultLabel(result: Game['result']): string {
    if (result === '1-0')     return '+';
    if (result === '0-1')     return '−';
    if (result === '1/2-1/2') return '=';
    return '×';
  }
</script>

<main>
  <header>
    <NavMenu />
    <h1>History</h1>
  </header>

  {#if lichessAccounts.length > 0}
    <section class="sync-section">
      {#each lichessAccounts as account (account.id)}
        <div class="sync-row">
          <span class="sync-label">lichess / {account.displayName}</span>
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

  {#if loading}
    <p class="loading">Loading…</p>
  {:else if games.length === 0}
    <p class="empty">No games yet. <a href="/">Play one!</a></p>
  {:else}
    <ul class="game-list">
      {#each games as game (game.id)}
        <li class="game-row">
          <span class="date">{formatDate(game.playedAt)}</span>
          <span class="players">
            <span class="player">{accountName(game.whiteAccountId)}</span>
            <span class="vs">vs</span>
            <span class="player">{accountName(game.blackAccountId)}</span>
          </span>
          <span class="result result-{resultClass(game.result)}">
            {resultLabel(game.result)}
          </span>
          <span class="tc">{game.timeControlBucket}</span>
          {#if game.source !== 'otb'}
            <span class="source">{game.source}</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
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
    border: 1px solid var(--clvq-accent-blue);
    border-radius: 4px;
    color: var(--clvq-accent-blue);
    padding: 0.2rem 0.6rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .sync-btn:hover:not(:disabled) {
    background: var(--clvq-surface-hover);
  }

  .sync-btn:disabled {
    opacity: 0.6;
    cursor: default;
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
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-md);
    font-size: 0.875rem;
    flex-wrap: wrap;
  }

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

  .result {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: var(--clvq-radius-sm);
    font-weight: 700;
    font-size: 0.75rem;
    flex-shrink: 0;
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
