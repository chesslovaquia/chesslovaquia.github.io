<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { QUICK_SETUPS } from '../lib/time-control';
  import type { TimeControl } from '../lib/time-control';
  import AccountPicker from './AccountPicker.svelte';
  import TimeControlPicker from './TimeControlPicker.svelte';
  import type { Account } from '../lib/accounts';

  export let accountList: Account[];
  export let whiteAccount: Account | null;
  export let blackAccount: Account | null;

  const dispatch = createEventDispatcher<{
    start: {
      timeControl: TimeControl | null;
      whiteAccountId: string;
      blackAccountId: string;
      orientation: 'white' | 'black';
    };
  }>();

  export let selectedTc: TimeControl | null = QUICK_SETUPS[4].tc; // 5+0 default
  export let orientation: 'white' | 'black' = 'white';

  function start() {
    const wId = whiteAccount?.id;
    const bId = blackAccount?.id;
    if (!wId || !bId) return;
    dispatch('start', {
      timeControl: selectedTc,
      whiteAccountId: wId,
      blackAccountId: bId,
      orientation,
    });
  }
</script>

<div class="quick-setup">
  <section class="section">
    <TimeControlPicker bind:selected={selectedTc} showCustom={true} showPresets={false} />
  </section>

  <section class="section">
    <h2>Players</h2>
    <div class="players">
      <div class="player-row">
        <span class="player-color white-dot">White</span>
        <AccountPicker accountList={accountList} bind:selected={whiteAccount} />
      </div>
      <div class="player-row">
        <span class="player-color black-dot">Black</span>
        <AccountPicker accountList={accountList} bind:selected={blackAccount} />
      </div>
    </div>
    <div class="orientation-row">
      <label class="orient-label">
        <input type="radio" bind:group={orientation} value="white" />
        View as White
      </label>
      <label class="orient-label">
        <input type="radio" bind:group={orientation} value="black" />
        View as Black
      </label>
    </div>
  </section>

  <button
    class="start-btn"
    disabled={!whiteAccount || !blackAccount}
    on:click={start}
  >Start Game</button>
</div>

<style>
  .quick-setup {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section h2 {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--clvq-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.5rem;
  }

  .players {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .player-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .player-color {
    font-size: 0.85rem;
    min-width: 3.5rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .player-color::before {
    content: '';
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid var(--clvq-border);
    flex-shrink: 0;
  }

  .white-dot::before {
    background: #f0d9b5;
  }

  .black-dot::before {
    background: #b58863;
  }

  .orientation-row {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }

  .orient-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    cursor: pointer;
  }

  .start-btn {
    padding: 0.65rem 1.5rem;
    background: none;
    border: 1px solid var(--clvq-accent);
    border-radius: 4px;
    color: var(--clvq-accent);
    font-size: 1rem;
    cursor: pointer;
    align-self: flex-start;
  }

  .start-btn:hover:not(:disabled) {
    background: var(--clvq-surface-hover);
  }

  .start-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
