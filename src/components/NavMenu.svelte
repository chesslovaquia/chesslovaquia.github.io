<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  let open = false;
  let menuEl: HTMLElement;

  function toggle(e: MouseEvent) {
    e.stopPropagation();
    open = !open;
  }

  function handleWindowClick(e: MouseEvent) {
    if (open && !menuEl.contains(e.target as Node)) {
      open = false;
    }
  }

  function close() {
    open = false;
  }
</script>

<svelte:window on:click={handleWindowClick} />

<div class="nav-menu" bind:this={menuEl}>
  <button class="icon-btn" on:click={toggle} aria-label="Menu" aria-expanded={open}>
    <img src="{import.meta.env.BASE_URL}favicon.ico" alt="Chesslovaquia" class="icon" />
  </button>
  {#if open}
    <ul class="dropdown" role="menu">
      <li role="none"><a href="/" role="menuitem" on:click={close}>Home</a></li>
      <li role="none"><a href="/history/" role="menuitem" on:click={close}>History</a></li>
      <li role="none"><a href="/settings/" role="menuitem" on:click={close}>Settings</a></li>
    </ul>
  {/if}
</div>

<style>
  .nav-menu {
    position: relative;
    display: inline-block;
  }

  .icon-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 4px;
  }

  .icon-btn:hover {
    opacity: 0.8;
  }

  .icon {
    width: 28px;
    height: 28px;
    display: block;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    background: var(--clvq-surface);
    border: 1px solid var(--clvq-border);
    border-radius: 4px;
    list-style: none;
    margin: 0;
    padding: 0.25rem 0;
    min-width: 130px;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .dropdown a {
    display: block;
    padding: 0.45rem 0.9rem;
    color: var(--clvq-fg);
    text-decoration: none;
    font-size: 0.9rem;
  }

  .dropdown a:hover {
    background: var(--clvq-surface-hover);
    color: var(--clvq-accent-green);
  }
</style>
