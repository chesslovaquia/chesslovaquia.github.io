<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { accounts, init, saveAccount, removeAccount } from './lib/accounts';
  import type { Account } from './lib/accounts';
  import { logger } from './lib/logger';
  import { startAuth, completeAuth, revokeToken } from './lib/lichess/auth';
  import { importUserGames } from './lib/lichess/history';

  let newName = '';
  let adding = false;
  let error = '';
  let authError = '';
  let syncStatus = new Map<string, string>(); // accountId → status message

  const redirectUri = window.location.origin + window.location.pathname;

  onMount(async () => {
    await init();
    await handleOAuthCallback();
  });

  /** Detect and handle a lichess OAuth callback (?code=...&state=...). */
  async function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) return;

    // Clean the URL so a page refresh doesn't re-trigger the flow
    history.replaceState({}, '', window.location.pathname);

    try {
      await completeAuth(code, state, redirectUri);
      logger.debug('lichess account connected');
    } catch (err) {
      logger.error('lichess auth callback error', err);
      authError = 'Could not connect lichess account. Please try again.';
    }
  }

  async function addAccount() {
    const name = newName.trim();
    if (!name) { error = 'Name is required.'; return; }
    error = '';
    adding = true;
    try {
      const account: Account = {
        id: crypto.randomUUID(),
        network: 'otb',
        displayName: name,
        handle: null,
        credentials: null,
        createdAt: Date.now(),
      };
      await saveAccount(account);
      newName = '';
    } catch (err) {
      logger.error('add account', err);
      error = 'Failed to add account.';
    } finally {
      adding = false;
    }
  }

  async function handleRemove(account: Account) {
    if (!window.confirm(`Remove "${account.displayName}"?`)) return;
    try {
      if (account.network === 'lichess') {
        await revokeToken(account);
      }
      await removeAccount(account.id);
    } catch (err) {
      logger.error('remove account', err);
    }
  }

  async function connectLichess() {
    authError = '';
    try {
      await startAuth(redirectUri);
    } catch (err) {
      logger.error('lichess auth start', err);
      authError = 'Could not start lichess login. Please try again.';
    }
  }

  async function syncHistory(account: Account) {
    syncStatus = new Map(syncStatus).set(account.id, 'Syncing…');
    try {
      const count = await importUserGames(account);
      syncStatus = new Map(syncStatus).set(account.id, `${count} game${count === 1 ? '' : 's'} imported`);
    } catch (err) {
      logger.error('lichess history sync', err);
      syncStatus = new Map(syncStatus).set(account.id, 'Sync failed');
    }
  }

  function networkLabel(network: Account['network']): string {
    if (network === 'otb') return 'OTB';
    if (network === 'lichess') return 'lichess';
    return 'chess.com';
  }

  $: otbAccounts = $accounts.filter((a) => a.network === 'otb');
  $: lichessAccounts = $accounts.filter((a) => a.network === 'lichess');
</script>

<main>
  <header>
    <a href="/" class="back">← Home</a>
    <h1>Settings</h1>
  </header>

  <!-- OTB Accounts -->
  <section class="section">
    <h2>OTB Accounts</h2>
    {#if otbAccounts.length === 0}
      <p class="empty">No OTB accounts.</p>
    {:else}
      <ul class="account-list">
        {#each otbAccounts as account (account.id)}
          <li class="account-row">
            <span class="display-name">{account.displayName}</span>
            <span class="network">{networkLabel(account.network)}</span>
            <button class="remove-btn" on:click={() => handleRemove(account)}>Remove</button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="section">
    <h2>Add OTB Account</h2>
    <form class="add-form" on:submit|preventDefault={addAccount}>
      <input
        type="text"
        placeholder="Display name"
        bind:value={newName}
        maxlength="40"
        disabled={adding}
      />
      <button type="submit" disabled={adding || !newName.trim()}>Add</button>
    </form>
    {#if error}
      <p class="error">{error}</p>
    {/if}
  </section>

  <!-- Lichess Accounts -->
  <section class="section">
    <h2>Lichess Accounts</h2>
    {#if authError}
      <p class="error">{authError}</p>
    {/if}
    {#if lichessAccounts.length === 0}
      <p class="empty">No lichess accounts connected.</p>
    {:else}
      <ul class="account-list">
        {#each lichessAccounts as account (account.id)}
          <li class="account-row">
            <span class="display-name">{account.displayName}</span>
            <span class="network lichess-badge">lichess</span>
            <button
              class="sync-btn"
              on:click={() => syncHistory(account)}
              disabled={syncStatus.get(account.id) === 'Syncing…'}
            >
              {#if syncStatus.has(account.id)}
                {syncStatus.get(account.id)}
              {:else}
                Sync history
              {/if}
            </button>
            <button class="remove-btn" on:click={() => handleRemove(account)}>Remove</button>
          </li>
        {/each}
      </ul>
    {/if}
    <button class="connect-btn" on:click={connectLichess}>
      + Connect lichess account
    </button>
  </section>
</main>

<style>
  main {
    max-width: 600px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }

  header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0;
  }

  .back {
    color: var(--clvq-muted);
    text-decoration: none;
    font-size: 0.9rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--clvq-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.75rem;
  }

  .empty {
    color: var(--clvq-muted);
    font-size: 0.9rem;
  }

  .account-list {
    list-style: none;
    margin: 0 0 0.75rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .account-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    font-size: 0.9rem;
    flex-wrap: wrap;
  }

  .display-name {
    flex: 1;
  }

  .network {
    font-size: 0.75rem;
    color: var(--clvq-muted);
  }

  .lichess-badge {
    color: var(--clvq-accent-blue);
  }

  .remove-btn {
    background: none;
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-accent-red);
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .remove-btn:hover {
    border-color: var(--clvq-accent-red);
  }

  .sync-btn {
    background: none;
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-muted);
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .sync-btn:hover:not(:disabled) {
    border-color: var(--clvq-accent-blue);
    color: var(--clvq-accent-blue);
  }

  .sync-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .connect-btn {
    background: none;
    border: 1px solid var(--clvq-accent-blue);
    border-radius: 4px;
    color: var(--clvq-accent-blue);
    padding: 0.4rem 0.9rem;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .connect-btn:hover {
    background: var(--clvq-surface-hover);
  }

  .add-form {
    display: flex;
    gap: 0.5rem;
  }

  .add-form input {
    flex: 1;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-fg);
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
  }

  .add-form input:focus {
    outline: none;
    border-color: var(--clvq-accent-green);
  }

  .add-form button {
    background: none;
    border: 1px solid var(--clvq-accent-green);
    border-radius: 4px;
    color: var(--clvq-accent-green);
    padding: 0.4rem 0.9rem;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .add-form button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .error {
    color: var(--clvq-accent-red);
    font-size: 0.85rem;
    margin: 0.5rem 0 0;
  }
</style>
