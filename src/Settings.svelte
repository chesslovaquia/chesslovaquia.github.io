<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import NavMenu from './components/NavMenu.svelte';
  import { accounts, init, saveAccount, removeAccount } from './lib/accounts';
  import type { Account } from './lib/accounts';
  import { OTB_USER_ID } from './lib/config';
  import { logger } from './lib/logger';
  import { startAuth, completeAuth, revokeToken } from './lib/lichess/auth';
  import { importUserGames } from './lib/lichess/history';

  let authError = '';
  let syncStatus = new Map<string, string>(); // accountId → status message
  let confirmingRemove: string | null = null;
  let editingUserId: string | null = null;
  let editingUserName = '';

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

  function startEditUser(account: Account) {
    editingUserId = account.id;
    editingUserName = account.displayName;
  }

  async function confirmEditUser() {
    if (!editingUserId) return;
    const account = $accounts.find((a) => a.id === editingUserId);
    if (!account) {
      editingUserId = null;
      return;
    }
    try {
      await saveAccount({ ...account, displayName: editingUserName });
    } catch (err) {
      logger.error('update user account', err);
    }
    editingUserId = null;
  }

  function cancelEditUser() {
    editingUserId = null;
  }

  function startRemove(account: Account) {
    confirmingRemove = account.id;
  }

  async function confirmRemove(account: Account) {
    confirmingRemove = null;
    try {
      if (account.network === 'lichess') {
        await revokeToken(account);
      }
      await removeAccount(account.id);
    } catch (err) {
      logger.error('remove account', err);
    }
  }

  function cancelRemove() {
    confirmingRemove = null;
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

  const appVersion: string = __APP_VERSION__;
  const appBuild: string = __APP_BUILD__;

  $: otbUser = $accounts.find((a) => a.id === OTB_USER_ID);
  $: lichessAccounts = $accounts.filter((a) => a.network === 'lichess');
</script>

<main>
  <header>
    <NavMenu />
    <h1>Settings</h1>
  </header>

  <!-- OTB Player -->
  <section class="section">
    <h2>Your Name</h2>
    {#if otbUser}
      <div class="account-row edit-row">
        {#if editingUserId === OTB_USER_ID}
          <input
            type="text"
            class="edit-input"
            bind:value={editingUserName}
            maxlength="40"
          />
          <button class="save-btn" on:click={confirmEditUser}>Save</button>
          <button class="cancel-btn" on:click={cancelEditUser}>Cancel</button>
        {:else}
          <span class="display-name">{otbUser.displayName}</span>
          <button class="edit-btn" on:click={() => startEditUser(otbUser)}>Edit</button>
        {/if}
      </div>
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
            {#if confirmingRemove === account.id}
              <button class="remove-btn danger" on:click={() => confirmRemove(account)}>Confirm remove</button>
              <button class="remove-btn" on:click={cancelRemove}>Cancel</button>
            {:else}
              <button class="remove-btn" on:click={() => startRemove(account)}>Remove</button>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    <button class="connect-btn" on:click={connectLichess}>
      + Connect lichess account
    </button>
  </section>

  <footer class="version">v{appVersion} · {appBuild}</footer>
</main>

<style>
  h1 {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0;
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
    border-radius: var(--clvq-radius-md);
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

  .remove-btn.danger {
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

  .edit-row {
    flex-wrap: wrap;
  }

  .edit-input {
    flex: 1;
    min-width: 150px;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-fg);
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
  }

  .edit-input:focus-visible {
    border-color: var(--clvq-accent);
  }

  .edit-btn {
    background: none;
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-muted);
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .edit-btn:hover {
    border-color: var(--clvq-accent);
    color: var(--clvq-accent);
  }

  .save-btn {
    background: none;
    border: 1px solid var(--clvq-accent);
    border-radius: 4px;
    color: var(--clvq-accent);
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .cancel-btn {
    background: none;
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    color: var(--clvq-muted);
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .cancel-btn:hover {
    border-color: var(--clvq-muted);
  }

  .error {
    color: var(--clvq-accent-red);
    font-size: 0.85rem;
    margin: 0.5rem 0 0;
  }

  .version {
    text-align: center;
    color: var(--clvq-muted);
    font-size: 0.75rem;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid var(--clvq-border);
  }
</style>
