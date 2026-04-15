<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import AccountPicker from './components/AccountPicker.svelte';
  import { accounts, selectedAccount } from './lib/accounts';
</script>

<main>
  <header>
    <h1>Chesslovaquia</h1>
  </header>

  <section class="account-section">
    <h2>Account</h2>
    <AccountPicker accountList={$accounts} bind:selected={$selectedAccount} />
  </section>
</main>

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0;
  }

  h2 {
    font-size: 1rem;
    font-weight: 500;
    color: var(--clvq-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.75rem;
  }

  .account-section {
    margin-bottom: 2rem;
  }
</style>
