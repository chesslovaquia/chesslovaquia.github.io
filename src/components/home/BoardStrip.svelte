<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  const ranks = 6;
  const files = 8;
  const light = '#d9b87a';
  const dark = '#8a5e34';
</script>

<div class="board-strip" aria-hidden="true">
  <svg viewBox="0 0 100 75" preserveAspectRatio="xMidYMin slice">
    <defs>
      <linearGradient id="board-strip-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(13,11,9,0)" />
        <stop offset="55%" stop-color="rgba(13,11,9,0.55)" />
        <stop offset="100%" stop-color="rgba(13,11,9,1)" />
      </linearGradient>
    </defs>
    {#each Array(ranks) as _, r}
      {#each Array(files) as _, f}
        <rect
          x={f * 12.5}
          y={r * 12.5}
          width="12.5"
          height="12.5"
          fill={(r + f) % 2 === 0 ? light : dark}
        />
      {/each}
    {/each}
    <rect x="0" y="0" width="100" height="75" fill="url(#board-strip-fade)" />
  </svg>
</div>

<style>
  .board-strip {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 240px;
    overflow: hidden;
    z-index: 0;
    pointer-events: none;
  }
  .board-strip svg {
    width: 100%;
    height: 100%;
    display: block;
    filter: blur(0.8px);
  }
</style>
