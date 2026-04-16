<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllGames } from './lib/games';
  import type { Game } from './lib/games';
  import { getAllAccounts } from './lib/accounts';
  import type { Account } from './lib/accounts';

  let games: Game[] = [];
  let accounts = new Map<string, Account>();
  let loading = true;

  onMount(async () => {
    const [allGames, allAccounts] = await Promise.all([getAllGames(), getAllAccounts()]);
    accounts = new Map(allAccounts.map((a) => [a.id, a]));
    games = allGames.sort((a, b) => b.playedAt - a.playedAt);
    loading = false;
  });

  function accountName(id: string): string {
    return accounts.get(id)?.displayName ?? '?';
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function resultClass(result: Game['result'], accountId: string, whiteId: string): string {
    if (result === '1/2-1/2') return 'draw';
    if (result === '*') return 'aborted';
    const whiteWon = result === '1-0';
    const isWhite = accountId === whiteId;
    return whiteWon === isWhite ? 'win' : 'loss';
  }
</script>

<main>
  <header>
    <a href="/" class="back">← Home</a>
    <h1>History</h1>
  </header>

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
          <span class="result result-{resultClass(game.result, game.whiteAccountId, game.whiteAccountId)}">
            {game.result}
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
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }

  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0;
  }

  .back {
    color: var(--clvq-muted);
    text-decoration: none;
    font-size: 0.9rem;
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
    border-radius: 4px;
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
    font-weight: 600;
    font-size: 0.8rem;
    min-width: 3.5rem;
    text-align: center;
  }

  .result-win   { color: var(--clvq-accent-green); }
  .result-loss  { color: var(--clvq-accent-red); }
  .result-draw  { color: var(--clvq-muted); }
  .result-aborted { color: var(--clvq-muted); }

  .tc {
    color: var(--clvq-muted);
    font-size: 0.75rem;
  }

  .source {
    color: var(--clvq-accent-blue);
    font-size: 0.75rem;
  }
</style>
