<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GameStatus } from '../lib/engine';

  export let status: GameStatus;
  export let moveCount: number;
  export let confirmingDraw = false;

  const dispatch = createEventDispatcher<{
    resign: void;
    offerdraw: void;
    canceldraw: void;
    abort: void;
    newgame: void;
  }>();

  $: inProgress = status === 'in_progress';
  $: isOver = !inProgress;
  $: canAbort = inProgress && moveCount < 2;
  $: canResign = inProgress && moveCount >= 2;
</script>

<div class="game-bar">
  {#if isOver}
    <button class="btn btn-primary" on:click={() => dispatch('newgame')}>New Game</button>
  {:else}
    {#if canAbort}
      <button class="btn btn-danger" on:click={() => dispatch('abort')}>Abort</button>
    {/if}
    {#if canResign}
      <button class="btn btn-danger" on:click={() => dispatch('resign')}>Resign</button>
    {/if}
    {#if inProgress}
      {#if confirmingDraw}
        <span class="draw-confirm-label">Both players agree?</span>
        <button class="btn btn-primary" on:click={() => dispatch('offerdraw')}>Confirm</button>
        <button class="btn" on:click={() => dispatch('canceldraw')}>Cancel</button>
      {:else}
        <button class="btn" on:click={() => dispatch('offerdraw')}>Offer Draw</button>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .game-bar {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.5rem 0;
  }

  .btn {
    padding: 0.4rem 0.9rem;
    border-radius: 4px;
    border: 1px solid var(--clvq-border);
    background: var(--clvq-surface);
    color: var(--clvq-fg);
    cursor: pointer;
    font-size: 0.85rem;
  }

  .btn:hover {
    background: var(--clvq-surface-hover);
  }

  .btn-primary {
    border-color: var(--clvq-accent-green);
    color: var(--clvq-accent-green);
  }

  .btn-danger {
    border-color: var(--clvq-accent-red);
    color: var(--clvq-accent-red);
  }

  .draw-confirm-label {
    font-size: 0.85rem;
    color: var(--clvq-muted);
    align-self: center;
  }
</style>
