<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  const path = window.location.pathname;
  $: active =
    path.startsWith('/history')  ? 'history'  :
    path.startsWith('/settings') ? 'settings' :
    'home';
</script>

<nav class="tabs" aria-label="Primary">
  <a href="/" class="tabs__btn" class:tabs__btn--active={active === 'home'}>
    <span class="tabs__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
    </span>
    <span class="tabs__label">Home</span>
  </a>
  <a href="/history/" class="tabs__btn" class:tabs__btn--active={active === 'history'}>
    <span class="tabs__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    </span>
    <span class="tabs__label">History</span>
  </a>
  <a href="/settings/" class="tabs__btn" class:tabs__btn--active={active === 'settings'}>
    <span class="tabs__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    </span>
    <span class="tabs__label">Settings</span>
  </a>
</nav>

<style>
  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    width: 100%;
    max-width: var(--clvq-page-width);
    margin: 0 auto;
    box-sizing: border-box;
    border-top: 1px solid var(--clvq-border);
    background: var(--clvq-bg);
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  .tabs__btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px 6px;
    background: transparent;
    border: 0;
    color: var(--clvq-muted);
    text-decoration: none;
    cursor: pointer;
  }
  .tabs__btn--active { color: var(--clvq-accent); }
  .tabs__icon { width: 22px; height: 22px; display: inline-flex; }
  .tabs__icon :global(svg) { width: 22px; height: 22px; }
  .tabs__label { font-size: 11px; font-weight: 500; }
</style>
