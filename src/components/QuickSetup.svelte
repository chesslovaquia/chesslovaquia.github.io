<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { QUICK_SETUPS } from '../lib/time-control';
  import type { TimeControl } from '../lib/time-control';
  import TimeControlPicker from './TimeControlPicker.svelte';

  const dispatch = createEventDispatcher<{
    start: {
      timeControl: TimeControl | null;
      orientation: 'white' | 'black';
    };
  }>();

  export let selectedTc: TimeControl | null = QUICK_SETUPS[4].tc; // 30+20 default
  export let orientation: 'white' | 'black' | 'random' = 'white';

  function start() {
    const actualOrientation = orientation === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : orientation;
    dispatch('start', {
      timeControl: selectedTc,
      orientation: actualOrientation,
    });
  }
</script>

<div class="quick-setup">
  <section class="section">
    <TimeControlPicker bind:selected={selectedTc} showCustom={true} showPresets={false} />
  </section>

  <section class="section">
    <h2>Orientation</h2>
    <div class="orientation-row">
      <label class="orient-label">
        <input type="radio" bind:group={orientation} value="white" />
        Play as White
      </label>
      <label class="orient-label">
        <input type="radio" bind:group={orientation} value="black" />
        Play as Black
      </label>
      <label class="orient-label">
        <input type="radio" bind:group={orientation} value="random" />
        Random
      </label>
    </div>
  </section>

  <button
    class="start-btn"
    disabled={!selectedTc}
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

  .orientation-row {
    display: flex;
    gap: 1rem;
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
