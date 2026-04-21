<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  export let color: 'white' | 'black';
  export let onChoose: (piece: 'q' | 'r' | 'b' | 'n') => void;
  export let onCancel: () => void;

  const pieces: { role: 'q' | 'r' | 'b' | 'n'; cgRole: string; label: string }[] = [
    { role: 'q', cgRole: 'queen',  label: 'Queen' },
    { role: 'r', cgRole: 'rook',   label: 'Rook' },
    { role: 'b', cgRole: 'bishop', label: 'Bishop' },
    { role: 'n', cgRole: 'knight', label: 'Knight' },
  ];
</script>

<div class="overlay" role="none">
  <div
    class="dialog"
    role="dialog"
    aria-modal="true"
    aria-label="Choose promotion piece"
  >
    <p class="title">Promote to:</p>
    <div class="pieces">
      {#each pieces as { role, cgRole, label }}
        <button class="piece-btn" on:click={() => onChoose(role)} title={label}>
          <!-- Use a .cg-wrap wrapper so chessground.cburnett.css selectors apply -->
          <span class="cg-wrap piece-preview">
            <piece class="{cgRole} {color}"></piece>
          </span>
          <span>{label}</span>
        </button>
      {/each}
    </div>
    <button class="cancel-btn" on:click={onCancel}>Cancel</button>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dialog {
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: var(--clvq-radius-md);
    padding: 1rem;
  }

  .title {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    color: var(--clvq-muted);
    text-align: center;
  }

  .pieces {
    display: flex;
    gap: 0.5rem;
  }

  .piece-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    background: none;
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--clvq-fg);
    font-size: 0.75rem;
  }

  .piece-btn:hover {
    background: var(--clvq-surface-hover);
    border-color: var(--clvq-accent-green);
  }

  .piece-preview {
    display: block;
    width: 60px;
    height: 60px;
    position: relative;
    flex-shrink: 0;
  }

  /* piece is absolutely positioned inside .cg-wrap; fill the preview box */
  :global(.piece-preview piece) {
    width: 100% !important;
    height: 100% !important;
    position: absolute;
    top: 0;
    left: 0;
    background-size: cover;
  }

  .cancel-btn {
    margin-top: 0.5rem;
    width: 100%;
    background: none;
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-muted);
    padding: 0.3rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .cancel-btn:hover {
    background: var(--clvq-surface-hover);
  }
</style>
