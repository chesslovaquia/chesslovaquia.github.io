<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import type { Account } from '../lib/accounts';
  import { persistSelection } from '../lib/accounts';

  export let accountList: Account[];
  export let selected: Account | null;

  function select(account: Account): void {
    selected = account;
    persistSelection(account);
  }

  function networkLabel(network: Account['network']): string {
    if (network === 'otb') return 'OTB';
    if (network === 'lichess') return 'lichess';
    return 'chess.com';
  }
</script>

<div class="account-picker">
  {#if accountList.length === 0}
    <p class="empty">No accounts yet.</p>
  {:else}
    {#each accountList as account (account.id)}
      <button
        class="account-btn"
        class:active={selected?.id === account.id}
        on:click={() => select(account)}
      >
        <span class="display-name">{account.displayName}</span>
        <span class="network">{networkLabel(account.network)}</span>
      </button>
    {/each}
  {/if}
</div>

<style>
  .account-picker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .account-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.6rem 1rem;
    background: var(--clvq-surface);
    color: var(--clvq-fg);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    font-size: 0.95rem;
    transition: background 0.15s;
  }

  .account-btn:hover {
    background: var(--clvq-surface-hover);
  }

  .account-btn.active {
    border-color: var(--clvq-accent-green);
    color: var(--clvq-accent-green);
  }

  .network {
    font-size: 0.75rem;
    color: var(--clvq-muted);
  }

  .account-btn.active .network {
    color: var(--clvq-accent-green);
  }

  .empty {
    color: var(--clvq-muted);
    font-style: italic;
  }
</style>
