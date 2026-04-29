<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let value: 'otb' | 'lichess';
  const dispatch = createEventDispatcher<{ change: 'otb' | 'lichess' }>();
  function set(v: 'otb' | 'lichess') { dispatch('change', v); }
</script>

<div class="mode-seg" role="tablist">
  <button
    role="tab"
    aria-selected={value === 'otb'}
    class="mode-seg__btn"
    class:mode-seg__btn--active={value === 'otb'}
    on:click={() => set('otb')}
  >Over the board</button>
  <button
    role="tab"
    aria-selected={value === 'lichess'}
    class="mode-seg__btn"
    class:mode-seg__btn--active={value === 'lichess'}
    on:click={() => set('lichess')}
  >Lichess</button>
</div>

<style>
  .mode-seg {
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-md);
    padding: 3px;
    gap: 3px;
  }
  .mode-seg__btn {
    background: transparent;
    border: 0;
    padding: 0.55rem 0.5rem;
    color: var(--clvq-muted);
    font-size: 0.92rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: var(--clvq-radius-sm);
  }
  .mode-seg__btn--active {
    background: var(--clvq-bg);
    color: var(--clvq-accent);
    box-shadow: inset 0 0 0 1px var(--clvq-accent);
  }
</style>
