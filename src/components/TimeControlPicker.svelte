<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { QUICK_SETUPS, classifyTimeControl } from '../lib/time-control';
  import type { TimeControl, TimeControlBucket } from '../lib/time-control';

  export let selected: TimeControl | null;
  export let disabledBuckets: TimeControlBucket[] = [];
  export let showCustom: boolean = false;

  let customInitial = 10;
  let customIncrement = 0;
  let isCustom = false;

  function isDisabled(tc: TimeControl): boolean {
    if (disabledBuckets.length === 0) return false;
    return disabledBuckets.includes(classifyTimeControl(tc));
  }

  $: selectedIndex = isCustom
    ? -1
    : QUICK_SETUPS.findIndex(
        (s) => s.tc.initialSec === selected?.initialSec && s.tc.incrementSec === selected?.incrementSec,
      );

  function selectPreset(tc: TimeControl) {
    selected = tc;
    isCustom = false;
  }

  function selectCustom() {
    isCustom = true;
    selected = { initialSec: customInitial * 60, incrementSec: customIncrement };
  }

  $: if (isCustom) {
    selected = { initialSec: customInitial * 60, incrementSec: customIncrement };
  }
</script>

<div class="preset-grid">
  {#each QUICK_SETUPS as { label, tc }, i}
    <button
      class="preset"
      class:selected={i === selectedIndex}
      disabled={isDisabled(tc)}
      on:click={() => selectPreset(tc)}
    >{label}</button>
  {/each}
  {#if showCustom}
    <button
      class="preset"
      class:selected={isCustom}
      on:click={selectCustom}
    >Custom</button>
  {/if}
</div>
{#if showCustom && isCustom}
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

<style>
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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

  .preset:hover:not(:disabled) {
    background: var(--clvq-surface-hover);
  }

  .preset.selected {
    border-color: var(--clvq-accent-green);
    color: var(--clvq-accent-green);
  }

  .preset:disabled {
    opacity: 0.35;
    cursor: not-allowed;
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
</style>
