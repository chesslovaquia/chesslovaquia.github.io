<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import BottomTabs from './components/BottomTabs.svelte';
  import BarChart from './components/BarChart.svelte';
  import { getAllGames } from './lib/games';
  import type { Game } from './lib/games';
  import { getAllAccounts } from './lib/accounts';
  import type { Account, Network } from './lib/accounts';
  import type { TimeControlBucket } from './lib/time-control';
  import {
    toPerspective,
    tally,
    recordForAccount,
    recordByBucket,
    recordByColor,
    recordByNetwork,
    openingFrequency,
    byDayOfWeek,
    byHourOfDay,
    rollingWindow,
  } from './lib/stats';
  import type { RecordStats } from './lib/stats';

  type Tab = 'overview' | 'openings' | 'patterns' | 'trends';

  const BUCKET_ORDER: TimeControlBucket[] = ['bullet', 'blitz', 'rapid', 'classical', 'correspondence'];
  const NETWORK_ORDER: Network[] = ['otb', 'lichess', 'chesscom'];
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ROLLING_WINDOWS = [10, 50, 100];

  let allGames: Game[] = [];
  let accounts: Account[] = [];
  let loading = true;
  let tab: Tab = 'overview';

  let filterNetwork: 'all' | Network = 'all';
  let filterAccountId = 'all';
  let filterBucket: 'all' | TimeControlBucket = 'all';
  let filterSince = '';
  let filterUntil = '';

  onMount(async () => {
    const [games, allAccounts] = await Promise.all([getAllGames(), getAllAccounts()]);
    allGames = games;
    accounts = allAccounts;
    loading = false;
  });

  $: ownAccountIds = new Set(accounts.map((a) => a.id));

  $: filteredGames = allGames.filter((game) => {
    if (filterNetwork !== 'all' && game.source !== filterNetwork) return false;
    if (filterAccountId !== 'all' && game.whiteAccountId !== filterAccountId && game.blackAccountId !== filterAccountId) {
      return false;
    }
    if (filterBucket !== 'all' && game.timeControlBucket !== filterBucket) return false;
    if (filterSince && game.playedAt < new Date(filterSince).getTime()) return false;
    if (filterUntil && game.playedAt > new Date(`${filterUntil}T23:59:59`).getTime()) return false;
    return true;
  });

  $: pgames = toPerspective(filteredGames, ownAccountIds, filterAccountId !== 'all' ? filterAccountId : null);

  $: overall = tally(pgames);
  $: bucketMap = recordByBucket(pgames);
  $: bucketRows = BUCKET_ORDER
    .map((bucket) => ({ bucket, record: bucketMap.get(bucket) }))
    .filter((r): r is { bucket: TimeControlBucket; record: RecordStats } => !!r.record && r.record.total > 0);
  $: colorRows = (() => {
    const byColor = recordByColor(pgames);
    return [
      { label: 'White', record: byColor.white },
      { label: 'Black', record: byColor.black },
    ];
  })();
  $: networkMap = recordByNetwork(pgames);
  $: networkRows = NETWORK_ORDER
    .map((network) => ({ network, record: networkMap.get(network) }))
    .filter((r): r is { network: Network; record: RecordStats } => !!r.record && r.record.total > 0);
  $: accountRows = accounts
    .map((account) => ({ account, record: recordForAccount(filteredGames, account.id) }))
    .filter((r) => r.record.total > 0)
    .sort((a, b) => b.record.total - a.record.total);

  $: openings = openingFrequency(pgames);
  $: topOpenings = openings.slice(0, 10);

  $: dayRows = byDayOfWeek(pgames).map((record, i) => ({ label: DAY_LABELS[i], record }));
  $: hourRows = byHourOfDay(pgames).map((record, i) => ({ label: String(i).padStart(2, '0'), record }));

  $: trendRows = ROLLING_WINDOWS.map((size) => ({ size, record: rollingWindow(pgames, size) }));

  function pct(record: RecordStats): string {
    return `${Math.round(record.winRate * 100)}%`;
  }
</script>

<div class="page-shell">
<main>
  <header>
    <h1>Stats</h1>
  </header>

  {#if !loading && allGames.length > 0}
    <section class="filter-section">
      <select class="filter-select" bind:value={filterNetwork} aria-label="Filter by network">
        <option value="all">All networks</option>
        <option value="otb">OTB</option>
        <option value="lichess">Lichess</option>
        <option value="chesscom">Chess.com</option>
      </select>
      <select class="filter-select" bind:value={filterAccountId} aria-label="Filter by account">
        <option value="all">All accounts</option>
        {#each accounts as account (account.id)}
          <option value={account.id}>{account.network} / {account.displayName}</option>
        {/each}
      </select>
      <select class="filter-select" bind:value={filterBucket} aria-label="Filter by time control">
        <option value="all">All time controls</option>
        {#each BUCKET_ORDER as bucket}
          <option value={bucket}>{bucket}</option>
        {/each}
      </select>
      <input class="filter-date" type="date" bind:value={filterSince} aria-label="Since date" />
      <input class="filter-date" type="date" bind:value={filterUntil} aria-label="Until date" />
    </section>
  {/if}

  {#if loading}
    <p class="loading">Loading…</p>
  {:else if allGames.length === 0}
    <p class="empty">No games yet. <a href="/">Play one!</a></p>
  {:else if filteredGames.length === 0}
    <p class="empty">No games match the selected filters.</p>
  {:else}
    <nav class="tab-bar" aria-label="Stats sections">
      <button class="tab-btn" class:tab-btn--active={tab === 'overview'} on:click={() => (tab = 'overview')}>Overview</button>
      <button class="tab-btn" class:tab-btn--active={tab === 'openings'} on:click={() => (tab = 'openings')}>Openings</button>
      <button class="tab-btn" class:tab-btn--active={tab === 'patterns'} on:click={() => (tab = 'patterns')}>Patterns</button>
      <button class="tab-btn" class:tab-btn--active={tab === 'trends'} on:click={() => (tab = 'trends')}>Trends</button>
    </nav>

    {#if tab === 'overview'}
      <section class="stat-section">
        <div class="summary-card">
          <span class="summary-figure">{overall.wins}W {overall.losses}L {overall.draws}D</span>
          <span class="summary-winrate">{pct(overall)} win rate · {overall.total} game{overall.total === 1 ? '' : 's'}</span>
        </div>

        {#if bucketRows.length > 0}
          <h2>By time control</h2>
          <table class="stat-table">
            <thead><tr><th>Bucket</th><th>W</th><th>L</th><th>D</th><th>Total</th><th>Win%</th></tr></thead>
            <tbody>
              {#each bucketRows as row (row.bucket)}
                <tr><td>{row.bucket}</td><td>{row.record.wins}</td><td>{row.record.losses}</td><td>{row.record.draws}</td><td>{row.record.total}</td><td>{pct(row.record)}</td></tr>
              {/each}
            </tbody>
          </table>
        {/if}

        <h2>By color</h2>
        <table class="stat-table">
          <thead><tr><th>Color</th><th>W</th><th>L</th><th>D</th><th>Total</th><th>Win%</th></tr></thead>
          <tbody>
            {#each colorRows as row (row.label)}
              <tr><td>{row.label}</td><td>{row.record.wins}</td><td>{row.record.losses}</td><td>{row.record.draws}</td><td>{row.record.total}</td><td>{pct(row.record)}</td></tr>
            {/each}
          </tbody>
        </table>

        {#if networkRows.length > 0}
          <h2>By network</h2>
          <table class="stat-table">
            <thead><tr><th>Network</th><th>W</th><th>L</th><th>D</th><th>Total</th><th>Win%</th></tr></thead>
            <tbody>
              {#each networkRows as row (row.network)}
                <tr><td>{row.network}</td><td>{row.record.wins}</td><td>{row.record.losses}</td><td>{row.record.draws}</td><td>{row.record.total}</td><td>{pct(row.record)}</td></tr>
              {/each}
            </tbody>
          </table>
        {/if}

        {#if accountRows.length > 0}
          <h2>By account</h2>
          <table class="stat-table">
            <thead><tr><th>Account</th><th>W</th><th>L</th><th>D</th><th>Total</th><th>Win%</th></tr></thead>
            <tbody>
              {#each accountRows as row (row.account.id)}
                <tr><td>{row.account.network} / {row.account.displayName}</td><td>{row.record.wins}</td><td>{row.record.losses}</td><td>{row.record.draws}</td><td>{row.record.total}</td><td>{pct(row.record)}</td></tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </section>
    {:else if tab === 'openings'}
      <section class="stat-section">
        {#if topOpenings.length === 0}
          <p class="empty">No opening data for these filters.</p>
        {:else}
          <h2>Top openings by frequency</h2>
          <BarChart items={topOpenings.map((o) => ({ label: o.eco, value: o.record.total }))} />

          <h2>All openings</h2>
          <table class="stat-table">
            <thead><tr><th>ECO</th><th>W</th><th>L</th><th>D</th><th>Total</th><th>Win%</th></tr></thead>
            <tbody>
              {#each openings as row (row.eco)}
                <tr><td>{row.eco}</td><td>{row.record.wins}</td><td>{row.record.losses}</td><td>{row.record.draws}</td><td>{row.record.total}</td><td>{pct(row.record)}</td></tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </section>
    {:else if tab === 'patterns'}
      <section class="stat-section">
        <h2>By day of week</h2>
        <BarChart items={dayRows.map((r) => ({ label: r.label, value: r.record.total }))} />

        <h2>By hour of day</h2>
        <BarChart items={hourRows.map((r) => ({ label: r.label, value: r.record.total }))} />
      </section>
    {:else if tab === 'trends'}
      <section class="stat-section">
        <h2>Recent form</h2>
        <BarChart
          items={trendRows.map((r) => ({ label: `Last ${r.size}`, value: Math.round(r.record.winRate * 100) }))}
          valueLabel={(v) => `${v}%`}
        />
        <table class="stat-table">
          <thead><tr><th>Window</th><th>W</th><th>L</th><th>D</th><th>Games</th><th>Win%</th></tr></thead>
          <tbody>
            {#each trendRows as row (row.size)}
              <tr><td>Last {row.size}</td><td>{row.record.wins}</td><td>{row.record.losses}</td><td>{row.record.draws}</td><td>{row.record.total}</td><td>{pct(row.record)}</td></tr>
            {/each}
          </tbody>
        </table>
      </section>
    {/if}
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

  h2 {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--clvq-muted);
    margin: 1.25rem 0 0.5rem;
  }

  .filter-section {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .filter-select,
  .filter-date {
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-sm);
    color: var(--clvq-fg);
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    flex: 1;
    min-width: 120px;
  }

  .filter-select:focus-visible,
  .filter-date:focus-visible {
    outline: 2px solid var(--clvq-accent);
    outline-offset: -2px;
  }

  .loading,
  .empty {
    color: var(--clvq-muted);
    font-size: 0.9rem;
  }

  .tab-bar {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--clvq-border);
  }

  .tab-btn {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--clvq-muted);
    padding: 0.5rem 0.2rem;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .tab-btn--active {
    color: var(--clvq-accent);
    border-bottom-color: var(--clvq-accent);
  }

  .tab-btn:focus-visible {
    outline: 2px solid var(--clvq-accent);
    outline-offset: 2px;
  }

  .summary-card {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-md);
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
  }

  .summary-figure {
    font-size: 1.2rem;
    font-weight: 600;
  }

  .summary-winrate {
    font-size: 0.8rem;
    color: var(--clvq-muted);
  }

  .stat-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }

  .stat-table th {
    text-align: left;
    color: var(--clvq-muted);
    font-weight: 500;
    padding: 0.3rem 0.4rem;
    border-bottom: 1px solid var(--clvq-border);
  }

  .stat-table td {
    padding: 0.3rem 0.4rem;
    border-bottom: 1px solid var(--clvq-border);
  }

  .stat-table th:not(:first-child),
  .stat-table td:not(:first-child) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
