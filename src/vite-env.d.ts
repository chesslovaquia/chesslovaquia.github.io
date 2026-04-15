// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

/// <reference types="svelte" />
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

// Fallback for Svelte components without a <script lang="ts"> block.
declare module '*.svelte' {
  import type { ComponentType, SvelteComponent } from 'svelte';
  const component: ComponentType<SvelteComponent>;
  export default component;
}
