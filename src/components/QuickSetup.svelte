<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { QUICK_SETUPS } from '../lib/time-control';
  import type { TimeControl } from '../lib/time-control';
  import AccountPicker from './AccountPicker.svelte';
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

  let selectedTc: TimeControl | null = QUICK_SETUPS[4].tc; // 5+0 default
  let showCustom = false;
  let customInitial = 10;
  let customIncrement = 0;
  let noClock = false;
  let orientation: 'white' | 'black' = 'white';

  function selectPreset(tc: TimeControl) {
    selectedTc = tc;
    noClock = false;
    showCustom = false;
  }

  function selectNoClock() {
    noClock = true;
    selectedTc = null;
    showCustom = false;
  }

  function selectCustom() {
    showCustom = true;
    noClock = false;
    selectedTc = { initialSec: customInitial * 60, incrementSec: customIncrement };
  }

  function isSelected(tc: TimeControl): boolean {
    if (!selectedTc || noClock) return false;
    return selectedTc.initialSec === tc.initialSec && selectedTc.incrementSec === tc.incrementSec;
  }

  $: if (showCustom) {
    selectedTc = { initialSec: customInitial * 60, incrementSec: customIncrement };
  }

  function start() {
    const wId = whiteAccount?.id;
    const bId = blackAccount?.id;
    if (!wId || !bId) return;
    dispatch('start', {
      timeControl: noClock ? null : selectedTc,
      whiteAccountId: wId,
      blackAccountId: bId,
      orientation,
    });
  }
</script>

<div class="quick-setup">
  <section class="section">
    <h2>Time Control</h2>
    <div class="preset-grid">
      {#each QUICK_SETUPS as { label, tc }}
        <button
          class="preset"
          class:selected={isSelected(tc)}
          on:click={() => selectPreset(tc)}
        >{label}</button>
      {/each}
      <button
        class="preset"
        class:selected={noClock}
        on:click={selectNoClock}
      >∞</button>
      <button
        class="preset"
        class:selected={showCustom && !noClock}
        on:click={selectCustom}
      >Custom</button>
    </div>
    {#if showCustom && !noClock}
      <div class="custom-tc">
        <label>
          <span>Minutes</span>
          <input type="number" min="0" max="180" bind:value={customInitial} />
        </label>
        <span>+</span>
        <label>
          <span>Increment (s)</span>
          <input type="number" min="0" max="60" bind:value={customIncrement} />
        </label>
      </div>
    {/if}
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

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 0.4rem;
  }

  .preset {
    padding: 0.4rem 0.25rem;
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    background: var(--clvq-surface);
    color: var(--clvq-fg);
    cursor: pointer;
    font-size: 0.85rem;
    text-align: center;
  }

  .preset:hover {
    background: var(--clvq-surface-hover);
  }

  .preset.selected {
    border-color: var(--clvq-accent-green);
    color: var(--clvq-accent-green);
  }

  .custom-tc {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }

  .custom-tc label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .custom-tc span {
    color: var(--clvq-muted);
    font-size: 0.8rem;
  }

  .custom-tc input {
    width: 5rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-fg);
    padding: 0.3rem 0.4rem;
    font-size: 0.9rem;
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
    border: 1px solid var(--clvq-accent-green);
    border-radius: 4px;
    color: var(--clvq-accent-green);
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
