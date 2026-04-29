<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let value: 'white' | 'random' | 'black';
  const dispatch = createEventDispatcher<{ change: 'white' | 'random' | 'black' }>();
  const opts = [
    { v: 'white' as const,  label: 'White' },
    { v: 'random' as const, label: 'Random' },
    { v: 'black' as const,  label: 'Black' },
  ];
</script>

<div class="orient">
  <div class="orient__label">Play as</div>
  <div class="orient__seg">
    {#each opts as o}
      <button
        class="orient__btn"
        class:orient__btn--selected={value === o.v}
        on:click={() => dispatch('change', o.v)}
      >
        <span class="orient__swatch orient__swatch--{o.v}"></span>
        <span>{o.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .orient { display: flex; flex-direction: column; gap: 4px; }
  .orient__label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--clvq-muted);
  }
  .orient__seg {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
  }
  .orient__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0.5rem 0.5rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-sm);
    color: var(--clvq-fg);
    font-size: 0.9rem;
    cursor: pointer;
  }
  .orient__btn--selected { border-color: var(--clvq-accent); color: var(--clvq-accent); }
  .orient__swatch {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid var(--clvq-border);
    flex-shrink: 0;
  }
  .orient__swatch--white  { background: #f0d9b5; }
  .orient__swatch--black  { background: #b58863; }
  .orient__swatch--random { background: linear-gradient(135deg, #f0d9b5 50%, #b58863 50%); }
</style>
