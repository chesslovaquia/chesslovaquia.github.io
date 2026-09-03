<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  export let items: { label: string; value: number; color?: string }[] = [];
  export let valueLabel: (value: number) => string = (v) => String(v);

  $: peak = Math.max(1, ...items.map((i) => i.value));
</script>

<div class="bar-chart">
  {#each items as item (item.label)}
    <div class="bar-row">
      <span class="bar-label">{item.label}</span>
      <svg class="bar-track" viewBox="0 0 100 10" preserveAspectRatio="none">
        <rect x="0" y="0" width="100" height="10" class="bar-bg" />
        <rect x="0" y="0" width={(item.value / peak) * 100} height="10" fill={item.color ?? 'var(--clvq-accent)'} />
      </svg>
      <span class="bar-value">{valueLabel(item.value)}</span>
    </div>
  {/each}
</div>

<style>
  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 4.5rem 1fr 3rem;
    align-items: center;
    gap: 0.5rem;
  }

  .bar-label {
    font-size: 0.75rem;
    color: var(--clvq-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bar-track {
    width: 100%;
    height: 0.7rem;
    display: block;
  }

  .bar-bg {
    fill: var(--clvq-surface);
  }

  .bar-value {
    font-size: 0.75rem;
    color: var(--clvq-fg);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
