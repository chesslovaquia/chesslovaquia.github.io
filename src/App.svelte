<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import NavMenu from './components/NavMenu.svelte';
  import QuickSetup from './components/QuickSetup.svelte';
  import TimeControlPicker from './components/TimeControlPicker.svelte';
  import { accounts, selectedAccount } from './lib/accounts';
  import type { Account } from './lib/accounts';
  import { LS_ACTIVE_GAME } from './lib/config';
  import type { TimeControl, TimeControlBucket } from './lib/time-control';
  import { QUICK_SETUPS, classifyTimeControl } from './lib/time-control';
  import { LichessClient } from './lib/lichess/client';
  import { seekAndWait, persistActiveGame } from './lib/lichess/play';
  import { logger } from './lib/logger';

  type PlayMode = 'otb' | 'lichess';

  interface StartEvent {
    timeControl: TimeControl | null;
    whiteAccountId: string;
    blackAccountId: string;
    orientation: 'white' | 'black';
  }

  let playMode: PlayMode = 'otb';

  // Lichess seek state
  let seekState: 'idle' | 'seeking' = 'idle';
  let seekError = '';
  let seekAbortController: AbortController | null = null;
  let selectedLichessAccount: Account | null = null;
  let selectedLichessTc: TimeControl | null = QUICK_SETUPS[6].tc; // 10+0 — first rapid preset

  $: lichessAccounts = $accounts.filter((a) => a.network === 'lichess');

  $: lichessTcInvalid = selectedLichessTc
    ? (['bullet', 'blitz'] as TimeControlBucket[]).includes(classifyTimeControl(selectedLichessTc))
    : false;

  $: {
    // Auto-select first lichess account when switching to lichess mode
    if (playMode === 'lichess' && !selectedLichessAccount && lichessAccounts.length > 0) {
      selectedLichessAccount = lichessAccounts[0];
    }
  }

  function handleStart(e: CustomEvent<StartEvent>) {
    const config = e.detail;
    localStorage.setItem(LS_ACTIVE_GAME, JSON.stringify(config));
    window.location.href = '/play/';
  }

  async function handleLichessSeek() {
    if (!selectedLichessAccount?.credentials?.accessToken) {
      seekError = 'No lichess account selected.';
      return;
    }
    if (!selectedLichessTc) {
      seekError = 'Select a time control.';
      return;
    }

    seekError = '';
    seekState = 'seeking';
    seekAbortController = new AbortController();

    const client = new LichessClient(selectedLichessAccount.credentials.accessToken);

    try {
      const { gameId, color } = await seekAndWait(client, selectedLichessTc, seekAbortController.signal);
      persistActiveGame({ gameId, accountId: selectedLichessAccount.id, color });
      window.location.href = '/play/';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — not an error
      } else {
        logger.error('lichess seek failed', err);
        seekError = 'Seek failed. Check your connection and try again.';
      }
      seekState = 'idle';
      seekAbortController = null;
    }
  }

  function cancelSeek() {
    seekAbortController?.abort();
    seekAbortController = null;
    seekState = 'idle';
  }
</script>

<main>
  <header>
    <NavMenu />
    <div class="mode-toggle">
      <button
        class="mode-btn"
        class:active={playMode === 'otb'}
        on:click={() => { playMode = 'otb'; }}
      >Over the board</button>
      <button
        class="mode-btn"
        class:active={playMode === 'lichess'}
        on:click={() => { playMode = 'lichess'; }}
      >Play on lichess</button>
    </div>
  </header>

  {#if playMode === 'otb'}
    <section class="setup-section">
      <QuickSetup
        accountList={$accounts}
        bind:whiteAccount={$selectedAccount}
        blackAccount={$accounts.find((a) => a.id !== $selectedAccount?.id) ?? $selectedAccount ?? null}
        on:start={handleStart}
      />
    </section>

  {:else}
    <!-- Lichess mode -->
    {#if lichessAccounts.length === 0}
      <div class="lichess-no-accounts">
        <p>No lichess accounts connected.</p>
        <a href="/settings/" class="connect-link">Connect a lichess account in Settings →</a>
      </div>
    {:else}
      <section class="setup-section">

        <!-- Account selector -->
        <div class="lich-section">
          <h2>Account</h2>
          <div class="account-pills">
            {#each lichessAccounts as account (account.id)}
              <button
                class="account-pill"
                class:selected={selectedLichessAccount?.id === account.id}
                on:click={() => { selectedLichessAccount = account; }}
              >{account.displayName}</button>
            {/each}
          </div>
        </div>

        <!-- Time control -->
        <div class="lich-section">
          <h2>Time Control</h2>
          <TimeControlPicker
            bind:selected={selectedLichessTc}
            disabledBuckets={['bullet', 'blitz']}
            showCustom={true}
          />
        </div>

        {#if lichessTcInvalid}
          <p class="tc-warning">Bullet and blitz not available for seeks — choose Rapid or longer.</p>
        {/if}

        {#if seekError}
          <p class="seek-error">{seekError}</p>
        {/if}

        {#if seekState === 'idle'}
          <button
            class="seek-btn"
            disabled={!selectedLichessAccount || !selectedLichessTc || lichessTcInvalid}
            on:click={handleLichessSeek}
          >Seek game</button>
        {:else}
          <div class="seeking-row">
            <span class="seeking-label">Seeking opponent…</span>
            <button class="cancel-btn" on:click={cancelSeek}>Cancel</button>
          </div>
        {/if}

      </section>
    {/if}
  {/if}
</main>

<style>
  main {
    max-width: 600px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }

  header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .mode-toggle {
    display: flex;
    gap: 0.4rem;
  }

  .mode-btn {
    padding: 0.35rem 0.85rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-muted);
    cursor: pointer;
    font-size: 0.875rem;
  }

  .mode-btn.active {
    border-color: var(--clvq-accent-green);
    color: var(--clvq-accent-green);
  }

  .mode-btn:hover:not(.active) {
    color: var(--clvq-fg);
  }

  /* Lichess mode */
  .lichess-no-accounts {
    color: var(--clvq-muted);
    font-size: 0.9rem;
  }

  .connect-link {
    color: var(--clvq-accent-blue);
    text-decoration: none;
    display: inline-block;
    margin-top: 0.5rem;
  }

  .lich-section {
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--clvq-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.5rem;
  }

  .account-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .account-pill {
    padding: 0.35rem 0.75rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-fg);
    cursor: pointer;
    font-size: 0.875rem;
  }

  .account-pill.selected {
    border-color: var(--clvq-accent-green);
    color: var(--clvq-accent-green);
  }

  .seek-btn {
    padding: 0.65rem 1.5rem;
    background: none;
    border: 1px solid var(--clvq-accent-green);
    border-radius: 4px;
    color: var(--clvq-accent-green);
    font-size: 1rem;
    cursor: pointer;
  }

  .seek-btn:hover:not(:disabled) {
    background: var(--clvq-surface-hover);
  }

  .seek-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .seeking-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .seeking-label {
    color: var(--clvq-muted);
    font-size: 0.9rem;
    font-style: italic;
  }

  .cancel-btn {
    background: none;
    border: 1px solid var(--clvq-accent-red);
    border-radius: 4px;
    color: var(--clvq-accent-red);
    padding: 0.35rem 0.75rem;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .tc-warning {
    color: var(--clvq-muted);
    font-size: 0.85rem;
    margin: 0 0 0.75rem;
  }

  .seek-error {
    color: var(--clvq-accent-red);
    font-size: 0.85rem;
    margin: 0 0 0.75rem;
  }
</style>
