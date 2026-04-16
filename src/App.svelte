<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import QuickSetup from './components/QuickSetup.svelte';
  import { accounts, selectedAccount } from './lib/accounts';
  import { LS_ACTIVE_GAME } from './lib/config';
  import type { TimeControl } from './lib/time-control';

  interface StartEvent {
    timeControl: TimeControl | null;
    whiteAccountId: string;
    blackAccountId: string;
    orientation: 'white' | 'black';
  }

  function handleStart(e: CustomEvent<StartEvent>) {
    const config = e.detail;
    localStorage.setItem(LS_ACTIVE_GAME, JSON.stringify(config));
    window.location.href = '/play/';
  }
</script>

<main>
  <header>
    <h1>Chesslovaquia</h1>
    <nav>
      <a href="/history/">History</a>
      <a href="/settings/">Settings</a>
    </nav>
  </header>

  <section class="setup-section">
    <QuickSetup
      accountList={$accounts}
      bind:whiteAccount={$selectedAccount}
      blackAccount={$accounts.find((a) => a.id !== $selectedAccount?.id) ?? $selectedAccount ?? null}
      on:start={handleStart}
    />
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
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0;
  }

  nav {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
  }

  nav a {
    color: var(--clvq-muted);
    text-decoration: none;
  }

  nav a:hover {
    color: var(--clvq-fg);
  }
</style>
