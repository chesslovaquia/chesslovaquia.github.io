<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  export let size: number = 1;
  export let dropShadow: boolean = false;
</script>

<span class="wordmark" class:wordmark--shadow={dropShadow} style="--wm-size: {size}">
  <span class="wordmark__glyph" aria-hidden="true">♞</span>
  <span class="wordmark__text">Chesslovaquia</span>
</span>

<style>
  .wordmark {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: calc(0.25rem * var(--wm-size));
    line-height: 1;
  }
  .wordmark__glyph {
    font-size: calc(1.8rem * var(--wm-size));
    line-height: 1;
    color: var(--clvq-accent);
    font-family: "DejaVu Sans", "Segoe UI Symbol", "Apple Symbols", sans-serif;
  }
  .wordmark__text {
    font-size: calc(0.78rem * var(--wm-size));
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--clvq-fg);
    border-top: 1px solid var(--clvq-accent);
    padding-top: calc(0.25rem * var(--wm-size));
  }
  .wordmark--shadow .wordmark__glyph,
  .wordmark--shadow .wordmark__text {
    text-shadow: 0 1px 12px rgba(0,0,0,0.85), 0 0 24px rgba(0,0,0,0.6);
  }
</style>
