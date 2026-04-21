<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { formatMs } from '../lib/clock';

  export let ms: number;
  export let active: boolean;
  export let label: string = '';
  export let lowTimeThresholdMs: number = 30_000;

  $: lowTime = active && ms <= lowTimeThresholdMs;
</script>

<div class="clock" class:active class:low-time={lowTime}>
  {#if label}
    <span class="clock-label">{label}</span>
  {/if}
  <span class="clock-time">{formatMs(ms)}</span>
</div>

<style>
  .clock {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    font-variant-numeric: tabular-nums;
  }

  .clock.active {
    border-color: var(--clvq-accent-green);
  }

  @keyframes clock-pulse {
    0%, 100% { border-color: var(--clvq-accent-red); }
    50%       { border-color: transparent; }
  }

  .clock.low-time {
    border-color: var(--clvq-accent-red);
    color: var(--clvq-accent-red);
    animation: clock-pulse 0.8s ease-in-out infinite;
  }

  .clock-label {
    font-size: 0.8rem;
    color: var(--clvq-muted);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .clock-time {
    font-size: 1.4rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    min-width: 4ch;
    text-align: right;
  }
</style>
