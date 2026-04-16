<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let moves: string[];
  export let currentIndex: number;   // 0-based half-move index; -1 = before game start

  const dispatch = createEventDispatcher<{ select: number }>();

  /** Svelte action: scroll into view when `isCurrent` is true. */
  function scrollIfCurrent(node: HTMLElement, isCurrent: boolean) {
    if (isCurrent) node.scrollIntoView({ block: 'nearest' });
    return {
      update(newIsCurrent: boolean) {
        if (newIsCurrent) node.scrollIntoView({ block: 'nearest' });
      },
    };
  }

  // Build display pairs: [[white_san, black_san | null], ...]
  $: pairs = (() => {
    const result: Array<{
      moveNum: number;
      white: string; whiteIdx: number;
      black: string | null; blackIdx: number | null;
    }> = [];
    for (let i = 0; i < moves.length; i += 2) {
      result.push({
        moveNum: Math.floor(i / 2) + 1,
        white: moves[i],
        whiteIdx: i,
        black: moves[i + 1] ?? null,
        blackIdx: moves[i + 1] !== undefined ? i + 1 : null,
      });
    }
    return result;
  })();
</script>

<div class="move-list">
  {#if pairs.length === 0}
    <span class="empty">No moves yet</span>
  {:else}
    {#each pairs as { moveNum, white, whiteIdx, black, blackIdx }}
      <span class="move-num">{moveNum}.</span>
      <span
        class="move"
        class:current={whiteIdx === currentIndex}
        use:scrollIfCurrent={whiteIdx === currentIndex}
        on:click={() => dispatch('select', whiteIdx)}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === 'Enter' && dispatch('select', whiteIdx)}
      >{white}</span>
      {#if black !== null && blackIdx !== null}
        <span
          class="move"
          class:current={blackIdx === currentIndex}
          use:scrollIfCurrent={blackIdx === currentIndex}
          on:click={() => dispatch('select', blackIdx)}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && dispatch('select', blackIdx)}
        >{black}</span>
      {:else}
        <span class="move placeholder"></span>
      {/if}
    {/each}
  {/if}
</div>

<style>
  .move-list {
    display: grid;
    grid-template-columns: auto 1fr 1fr;
    gap: 0.1rem 0.25rem;
    overflow-y: auto;
    max-height: 100%;
    font-size: 0.9rem;
    padding: 0.25rem;
  }

  .move-num {
    color: var(--clvq-muted);
    text-align: right;
    padding-right: 0.25rem;
    user-select: none;
  }

  .move {
    padding: 0.15rem 0.3rem;
    border-radius: 3px;
    cursor: pointer;
    white-space: nowrap;
  }

  .move:hover {
    background: var(--clvq-surface-hover);
  }

  .move.current {
    background: var(--clvq-accent-blue);
    color: #fff;
  }

  .move.placeholder {
    cursor: default;
  }

  .empty {
    color: var(--clvq-muted);
    font-size: 0.85rem;
    grid-column: 1 / -1;
    padding: 0.5rem 0.25rem;
  }
</style>
