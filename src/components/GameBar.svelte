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
      <button class="btn btn-icon btn-danger" title="Abort" on:click={() => dispatch('abort')}>✕</button>
    {/if}
    {#if canResign}
      <button class="btn btn-icon btn-danger" title="Resign" on:click={() => dispatch('resign')}>⚑</button>
    {/if}
    {#if inProgress}
      {#if confirmingDraw}
        <span class="draw-confirm-label">Agree?</span>
        <button class="btn btn-icon btn-primary" title="Confirm draw" on:click={() => dispatch('offerdraw')}>✓</button>
        <button class="btn btn-icon" title="Cancel" on:click={() => dispatch('canceldraw')}>✕</button>
      {:else}
        <button class="btn btn-icon" title="Offer Draw" on:click={() => dispatch('offerdraw')}>½</button>
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

  .btn-icon {
    width: 2.2rem;
    height: 2.2rem;
    padding: 0;
    font-size: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .btn-primary {
    border-color: var(--clvq-accent);
    color: var(--clvq-accent);
  }

  .btn-danger {
    border-color: var(--clvq-accent-red);
    color: var(--clvq-accent-red);
  }

  .draw-confirm-label {
    font-size: 0.8rem;
    color: var(--clvq-muted);
    align-self: center;
  }

  @media (orientation: landscape) and (min-width: 700px) {
    .game-bar {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: center;
      padding: 0.5rem 0;
      gap: 0.4rem;
    }

    .draw-confirm-label {
      display: none;
    }

    .btn-primary:not(.btn-icon) {
      writing-mode: vertical-rl;
      padding: 0.6rem 0.3rem;
      font-size: 0.8rem;
      height: auto;
      width: 2.2rem;
    }
  }
</style>
