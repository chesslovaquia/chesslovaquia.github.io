<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { accounts } from './lib/accounts';
  import type { Account } from './lib/accounts';
  import { LS_ACTIVE_GAME, LS_HOME_PREFS, OTB_GUEST_ID, OTB_USER_ID } from './lib/config';
  import type { TimeControl } from './lib/time-control';
  import { LichessClient } from './lib/lichess/client';
  import { seekAndWait, persistActiveGame } from './lib/lichess/play';
  import { logger } from './lib/logger';
  import Wordmark from './components/Wordmark.svelte';
  import BoardStrip from './components/home/BoardStrip.svelte';
  import ModeSegmented from './components/home/ModeSegmented.svelte';
  import TimePresets from './components/home/TimePresets.svelte';
  import OrientationPicker from './components/home/OrientationPicker.svelte';
  import BottomTabs from './components/BottomTabs.svelte';

  type PlayMode = 'otb' | 'lichess';

  interface HomePrefs {
    playMode: PlayMode;
    otbTc: TimeControl | null;
    otbOrientation: 'white' | 'black' | 'random';
    lichessAccountId: string | null;
    lichessTc: TimeControl | null;
  }

  // All presets from the TimePresets component, mapped to TimeControl
  const TC_PRESETS: { label: string; tc: TimeControl }[] = [
    { label: '1+0',   tc: { initialSec:   60, incrementSec:  0 } },
    { label: '2+1',   tc: { initialSec:  120, incrementSec:  1 } },
    { label: '3+0',   tc: { initialSec:  180, incrementSec:  0 } },
    { label: '5+0',   tc: { initialSec:  300, incrementSec:  0 } },
    { label: '5+3',   tc: { initialSec:  300, incrementSec:  3 } },
    { label: '10+0',  tc: { initialSec:  600, incrementSec:  0 } },
    { label: '10+5',  tc: { initialSec:  600, incrementSec:  5 } },
    { label: '15+10', tc: { initialSec:  900, incrementSec: 10 } },
    { label: '30+0',  tc: { initialSec: 1800, incrementSec:  0 } },
    { label: '30+20', tc: { initialSec: 1800, incrementSec: 20 } },
    { label: '45+0',  tc: { initialSec: 2700, incrementSec:  0 } },
  ];

  function tcToLabel(tc: TimeControl | null): string {
    if (!tc) return '30+20';
    return TC_PRESETS.find(
      (p) => p.tc.initialSec === tc.initialSec && p.tc.incrementSec === tc.incrementSec
    )?.label ?? '30+20';
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

  let mode: PlayMode = savedPrefs?.playMode ?? 'otb';
  let otbTc: TimeControl = savedPrefs?.otbTc ?? { initialSec: 1800, incrementSec: 20 };
  let otbTcLabel: string = tcToLabel(otbTc);
  let orient: 'white' | 'random' | 'black' = savedPrefs?.otbOrientation ?? 'random';
  let lichessTc: TimeControl = savedPrefs?.lichessTc ?? { initialSec: 2700, incrementSec: 0 };
  let lichessTcLabel: string = tcToLabel(lichessTc);

  let seekState: 'idle' | 'seeking' = 'idle';
  let seekError = '';
  let seekAbortController: AbortController | null = null;
  let selectedLichessAccount: Account | null = null;

  $: lichessAccounts = $accounts.filter((a) => a.network === 'lichess');
  $: otbUserAccount = $accounts.find((a) => a.id === OTB_USER_ID) ?? null;
  $: otbGuestAccount = $accounts.find((a) => a.id === OTB_GUEST_ID) ?? null;

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

  $: if (initialized && mode === 'lichess' && !selectedLichessAccount && lichessAccounts.length > 0) {
    selectedLichessAccount = lichessAccounts[0];
  }

  $: if (initialized) {
    localStorage.setItem(
      LS_HOME_PREFS,
      JSON.stringify({
        playMode: mode,
        otbTc,
        otbOrientation: orient,
        lichessAccountId: selectedLichessAccount?.id ?? null,
        lichessTc,
      } as HomePrefs),
    );
  }

  function handleOtbTcChange(e: CustomEvent<{ label: string; tc: { i: number; inc: number } }>) {
    otbTcLabel = e.detail.label;
    otbTc = { initialSec: e.detail.tc.i, incrementSec: e.detail.tc.inc };
  }

  function handleLichessTcChange(e: CustomEvent<{ label: string; tc: { i: number; inc: number } }>) {
    lichessTcLabel = e.detail.label;
    lichessTc = { initialSec: e.detail.tc.i, incrementSec: e.detail.tc.inc };
  }

  function startOtbGame() {
    if (!otbUserAccount || !otbGuestAccount) return;
    const actualOrientation: 'white' | 'black' =
      orient === 'random' ? (Math.random() < 0.5 ? 'white' : 'black') : orient;
    const whiteAccountId = actualOrientation === 'white' ? otbUserAccount.id : otbGuestAccount.id;
    const blackAccountId = actualOrientation === 'white' ? otbGuestAccount.id : otbUserAccount.id;
    localStorage.setItem(
      LS_ACTIVE_GAME,
      JSON.stringify({ timeControl: otbTc, whiteAccountId, blackAccountId, orientation: actualOrientation }),
    );
    window.location.href = '/play/';
  }

  async function startLichessSeek() {
    if (!selectedLichessAccount?.credentials?.accessToken) {
      seekError = 'No lichess account selected.';
      return;
    }
    seekError = '';
    seekState = 'seeking';
    seekAbortController = new AbortController();
    const client = new LichessClient(selectedLichessAccount.credentials.accessToken);
    try {
      const { gameId, color } = await seekAndWait(client, lichessTc, seekAbortController.signal);
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

<div class="app-shell">
  <div class="home-layout">
    <BoardStrip />

    <div class="home-content">
      <div class="home-header">
        <Wordmark size={1} dropShadow />
      </div>

      <ModeSegmented value={mode} on:change={(e) => (mode = e.detail)} />

      {#if mode === 'otb'}
        <TimePresets value={otbTcLabel} on:change={handleOtbTcChange} />
        <OrientationPicker value={orient} on:change={(e) => (orient = e.detail)} />
        <button class="primary-btn" on:click={startOtbGame}>Start game</button>
      {:else}
        <div class="lich-acct">
          <div class="lich-acct__label">Account</div>
          <button class="chip chip--acct" on:click={() => { window.location.href = '/settings/'; }}>
            {selectedLichessAccount?.displayName ?? 'Sign in'}
          </button>
        </div>

        <TimePresets value={lichessTcLabel} on:change={handleLichessTcChange} hideBullet hideBlitz />

        {#if seekError}
          <p class="seek-error">{seekError}</p>
        {/if}

        {#if seekState === 'idle'}
          <button
            class="primary-btn"
            on:click={startLichessSeek}
            disabled={!selectedLichessAccount}
          >Seek game</button>
        {:else}
          <div class="seeking-modal-overlay">
            <div class="seeking-modal">
              <p class="seeking-label">Seeking opponent<span class="seeking-dots" aria-hidden="true"></span></p>
              <button class="cancel-btn" on:click={cancelSeek}>Cancel</button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
  <BottomTabs />
</div>

<style>
  .app-shell {
    height: var(--clvq-vh);
    display: grid;
    grid-template-rows: 1fr auto;
    overflow: hidden;
  }

  .home-layout {
    background: var(--clvq-bg);
    color: var(--clvq-fg);
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
    display: grid;
    grid-template-rows: 1fr;
    min-height: 0;
  }

  .home-content {
    width: 100%;
    max-width: var(--clvq-page-width);
    margin: 0 auto;
    padding: 8px 18px 16px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 18px;
    overflow-y: auto;
    position: relative;
    z-index: 1;
    min-height: 0;
  }

  .home-header {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 130px;
    margin-bottom: 4px;
  }

  .lich-acct { display: flex; flex-direction: column; gap: 4px; }
  .lich-acct__label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--clvq-muted);
  }

  .chip--acct {
    padding: 0.4rem 0.85rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-accent);
    border-radius: var(--clvq-radius-sm);
    color: var(--clvq-accent);
    font-size: 0.9rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    cursor: pointer;
    align-self: flex-start;
  }

  .primary-btn {
    padding: 0.85rem 1rem;
    background: var(--clvq-accent);
    color: #1a1208;
    font-weight: 600;
    font-size: 1rem;
    border: 0;
    border-radius: var(--clvq-radius-md);
    cursor: pointer;
  }

  .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
    margin: 0;
  }
</style>
