<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { QUICK_SETUPS, classifyTimeControl } from '../lib/time-control';
  import type { TimeControl, TimeControlBucket } from '../lib/time-control';

  export let selected: TimeControl | null;
  export let hiddenBuckets: TimeControlBucket[] = [];
  export let showCustom: boolean = false;
  export let showPresets: boolean = true;

  let customInitial = 10;
  let customIncrement = 0;
  let isCustom = !showPresets;

  onMount(() => {
    if (!showPresets) {
      isCustom = true;
      if (selected) {
        customInitial = Math.round(selected.initialSec / 60);
        customIncrement = selected.incrementSec;
      }
      return;
    }
    if (!selected) return;
    const matchesPreset = QUICK_SETUPS.some(
      (s) => s.tc.initialSec === selected!.initialSec && s.tc.incrementSec === selected!.incrementSec,
    );
    if (!matchesPreset) {
      isCustom = true;
      customInitial = Math.round(selected.initialSec / 60);
      customIncrement = selected.incrementSec;
    }
  });

  const BUCKET_ORDER: TimeControlBucket[] = ['bullet', 'blitz', 'rapid', 'classical', 'correspondence'];

  const BUCKET_LABEL: Record<TimeControlBucket, string> = {
    bullet: 'Bullet',
    blitz: 'Blitz',
    rapid: 'Rapid',
    classical: 'Classical',
    correspondence: 'Correspondence',
  };

  interface BucketGroup {
    bucket: TimeControlBucket;
    label: string;
    setups: { label: string; tc: TimeControl; index: number }[];
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

  $: groups = BUCKET_ORDER.reduce<BucketGroup[]>((acc, bucket) => {
    if (hiddenBuckets.includes(bucket)) return acc;
    const setups = QUICK_SETUPS
      .map((s, i) => ({ ...s, index: i }))
      .filter((s) => classifyTimeControl(s.tc) === bucket);
    if (setups.length > 0) acc.push({ bucket, label: BUCKET_LABEL[bucket], setups });
    return acc;
  }, []);
</script>

{#if showPresets}
<div class="preset-groups">
  {#each groups as group}
    <div class="preset-group">
      <span class="bucket-label">{group.label}</span>
      <div class="preset-row">
        {#each group.setups as { label: presetLabel, tc, index }}
          <button
            class="preset"
            class:selected={index === selectedIndex}
            on:click={() => selectPreset(tc)}
          >{presetLabel}</button>
        {/each}
      </div>
    </div>
  {/each}
  {#if showCustom}
    <div class="preset-group">
      <span class="bucket-label">Custom</span>
      <div class="preset-row">
        <button
          class="preset"
          class:selected={isCustom}
          on:click={selectCustom}
        >Custom</button>
      </div>
    </div>
  {/if}
</div>
{/if}
{#if showCustom && isCustom || !showPresets}
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
  .preset-groups {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .preset-group {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .bucket-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--clvq-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .preset-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .preset {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    background: var(--clvq-surface);
    color: var(--clvq-fg);
    cursor: pointer;
    font-size: 0.85rem;
    text-align: center;
    min-width: 4rem;
  }

  .preset:hover {
    background: var(--clvq-surface-hover);
  }

  .preset.selected {
    border-color: var(--clvq-accent);
    color: var(--clvq-accent);
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
