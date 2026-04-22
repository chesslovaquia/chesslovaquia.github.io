<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import NavMenu from './components/NavMenu.svelte';
  import QuickSetup from './components/QuickSetup.svelte';
  import TimeControlPicker from './components/TimeControlPicker.svelte';
  import { accounts } from './lib/accounts';
  import type { Account } from './lib/accounts';
  import { LS_ACTIVE_GAME, LS_HOME_PREFS, OTB_GUEST_ID, OTB_USER_ID } from './lib/config';
  import type { TimeControl } from './lib/time-control';
  import { QUICK_SETUPS } from './lib/time-control';
  import { LichessClient } from './lib/lichess/client';
  import { seekAndWait, persistActiveGame } from './lib/lichess/play';
  import { logger } from './lib/logger';

  type PlayMode = 'otb' | 'lichess';

  interface HomePrefs {
    playMode: PlayMode;
    otbTc: TimeControl | null;
    otbOrientation: 'white' | 'black' | 'random';
    lichessAccountId: string | null;
    lichessTc: TimeControl | null;
  }

  interface StartEvent {
    timeControl: TimeControl | null;
    whiteAccountId: string;
    blackAccountId: string;
    orientation: 'white' | 'black';
  }

  function loadPrefs(): HomePrefs | null {
    try {
      const raw = localStorage.getItem(LS_HOME_PREFS);
      return raw ? (JSON.parse(raw) as HomePrefs) : null;
    } catch {
      return null;
    }
  }

  const savedPrefs = loadPrefs();

  let playMode: PlayMode = savedPrefs?.playMode ?? 'otb';
  let otbTc: TimeControl | null = savedPrefs?.otbTc ?? QUICK_SETUPS[4].tc; // 30+20 default
  let otbOrientation: 'white' | 'black' | 'random' = savedPrefs?.otbOrientation ?? 'white';

  // Lichess seek state
  let seekState: 'idle' | 'seeking' = 'idle';
  let seekError = '';
  let seekAbortController: AbortController | null = null;
  let selectedLichessAccount: Account | null = null;
  let selectedLichessTc: TimeControl | null = savedPrefs?.lichessTc ?? QUICK_SETUPS[5].tc;

  $: lichessAccounts = $accounts.filter((a) => a.network === 'lichess');

  $: otbUserAccount = $accounts.find((a) => a.id === OTB_USER_ID) ?? null;
  $: otbGuestAccount = $accounts.find((a) => a.id === OTB_GUEST_ID) ?? null;

  // One-time init of lichess-dependent state once accounts are loaded
  let initialized = false;
  $: if (!initialized && $accounts.length > 0) {
    const savedLichessId = savedPrefs?.lichessAccountId ?? null;
    const lichessNow = $accounts.filter((a) => a.network === 'lichess');
    selectedLichessAccount =
      (savedLichessId ? lichessNow.find((a) => a.id === savedLichessId) ?? null : null) ??
      lichessNow[0] ??
      null;

    initialized = true;
  }

  // Auto-select first lichess account when switching to lichess mode (post-init)
  $: if (initialized && playMode === 'lichess' && !selectedLichessAccount && lichessAccounts.length > 0) {
    selectedLichessAccount = lichessAccounts[0];
  }

  // Persist prefs whenever any tracked state changes (after accounts are loaded)
  $: if (initialized) {
    localStorage.setItem(
      LS_HOME_PREFS,
      JSON.stringify({
        playMode,
        otbTc,
        otbOrientation,
        lichessAccountId: selectedLichessAccount?.id ?? null,
        lichessTc: selectedLichessTc,
      } as HomePrefs),
    );
  }

  function handleStart(e: CustomEvent<{ timeControl: TimeControl | null; orientation: 'white' | 'black' }>) {
    const { timeControl, orientation } = e.detail;
    if (!otbUserAccount || !otbGuestAccount) return;

    const whiteAccountId = orientation === 'white' ? otbUserAccount.id : otbGuestAccount.id;
    const blackAccountId = orientation === 'white' ? otbGuestAccount.id : otbUserAccount.id;

    const config: StartEvent = {
      timeControl,
      whiteAccountId,
      blackAccountId,
      orientation,
    };
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
    <h1 class="app-title">Chesslovaquia</h1>
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
    <div class="mode-content" transition:fade={{ duration: 120 }}>
      <section class="setup-section">
        <QuickSetup
          bind:selectedTc={otbTc}
          bind:orientation={otbOrientation}
          on:start={handleStart}
        />
      </section>
    </div>

  {:else}
    <div class="mode-content" transition:fade={{ duration: 120 }}>
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
          <TimeControlPicker
            bind:selected={selectedLichessTc}
            hiddenBuckets={['bullet', 'blitz']}
            showCustom={true}
          />
        </div>

        {#if seekError}
          <p class="seek-error">{seekError}</p>
        {/if}

        {#if seekState === 'idle'}
          <button
            class="seek-btn"
            disabled={!selectedLichessAccount || !selectedLichessTc}
            on:click={handleLichessSeek}
          >Seek game</button>
        {:else}
          <div class="seeking-modal-overlay">
            <div class="seeking-modal">
              <p class="seeking-label">Seeking opponent<span class="seeking-dots" aria-hidden="true"></span></p>
              <button class="cancel-btn" on:click={cancelSeek}>Cancel</button>
            </div>
          </div>
        {/if}

      </section>
    {/if}
    </div>
  {/if}
</main>

<style>
  .app-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    flex: 1;
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
    border-color: var(--clvq-accent);
    color: var(--clvq-accent);
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
    border-color: var(--clvq-accent);
    color: var(--clvq-accent);
  }

  .seek-btn {
    padding: 0.65rem 1.5rem;
    background: none;
    border: 1px solid var(--clvq-accent);
    border-radius: 4px;
    color: var(--clvq-accent);
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

  .seeking-modal-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
  }

  .seeking-modal {
    background: var(--clvq-bg);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-md);
    padding: 1.5rem;
    text-align: center;
    min-width: 300px;
  }

  .seeking-label {
    color: var(--clvq-fg);
    font-size: 0.95rem;
    margin: 0 0 1rem;
    white-space: nowrap;
    display: block;
  }

  .seeking-dots::after {
    content: '';
    animation: seeking-ellipsis 1.4s steps(4, end) infinite;
  }

  @keyframes seeking-ellipsis {
    0%   { content: ''; }
    25%  { content: '.'; }
    50%  { content: '..'; }
    75%  { content: '...'; }
    100% { content: ''; }
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


  .seek-error {
    color: var(--clvq-accent-red);
    font-size: 0.85rem;
    margin: 0 0 0.75rem;
  }
</style>
