<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  type TC = { i: number; inc: number };
  type Preset = { label: string; tc: TC };

  export let value: string;
  export let hideBullet: boolean = false;
  export let hideBlitz: boolean = false;

  const PRESETS: Record<string, Preset[]> = {
    bullet:    [{ label: '1+0', tc: { i: 60, inc: 0 } },   { label: '2+1', tc: { i: 120, inc: 1 } }],
    blitz:     [{ label: '3+0', tc: { i: 180, inc: 0 } },  { label: '5+0', tc: { i: 300, inc: 0 } }, { label: '5+3', tc: { i: 300, inc: 3 } }],
    rapid:     [{ label: '10+0', tc: { i: 600, inc: 0 } }, { label: '10+5', tc: { i: 600, inc: 5 } }, { label: '15+10', tc: { i: 900, inc: 10 } }],
    classical: [{ label: '30+0', tc: { i: 1800, inc: 0 } }, { label: '30+20', tc: { i: 1800, inc: 20 } }, { label: '45+0', tc: { i: 2700, inc: 0 } }],
  };

  $: buckets = Object.entries(PRESETS).filter(([k]) => {
    if (hideBullet && k === 'bullet') return false;
    if (hideBlitz  && k === 'blitz')  return false;
    return true;
  });

  const dispatch = createEventDispatcher<{ change: Preset }>();
  function pick(p: Preset) { dispatch('change', p); }
</script>

<div class="presets">
  {#each buckets as [bucket, items]}
    <div class="presets__bucket">
      <div class="presets__label">{bucket}</div>
      <div class="presets__chips">
        {#each items as p}
          <button
            class="chip"
            class:chip--selected={value === p.label}
            on:click={() => pick(p)}
          >{p.label}</button>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .presets { display: flex; flex-direction: column; gap: 10px; }
  .presets__bucket { display: flex; flex-direction: column; gap: 4px; }
  .presets__label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--clvq-muted);
  }
  .presets__chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    padding: 0.4rem 0.85rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-sm);
    color: var(--clvq-fg);
    font-size: 0.9rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    cursor: pointer;
  }
  .chip--selected { border-color: var(--clvq-accent); color: var(--clvq-accent); }
</style>
