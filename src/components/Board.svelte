<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->
<!-- See LICENSE file. -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Chessground } from '@lichess-org/chessground';
  import type { Api } from '@lichess-org/chessground/api';
  import type { Config } from '@lichess-org/chessground/config';
  import type { Key, Dests } from '@lichess-org/chessground/types';
  import PromotionDialog from './PromotionDialog.svelte';
  import { LS_BOARD_THEME, LS_BOARD_PIECES } from '../lib/config';

  export let fen: string;
  export let orientation: 'white' | 'black';
  export let movableColor: 'white' | 'black' | null;
  export let dests: Map<string, string[]> | null;
  export let lastMove: [string, string] | null = null;
  export let viewOnly: boolean = false;
  export let onMove: (orig: string, dest: string, promotion?: string) => void;

  let el: HTMLDivElement;
  let api: Api | null = null;

  // Resolved from localStorage
  const _theme = localStorage.getItem(LS_BOARD_THEME) ?? 'brown';
  const _pieces = localStorage.getItem(LS_BOARD_PIECES) ?? 'cburnett';

  // Pending promotion: orig+dest waiting for piece choice
  let pendingPromo: { orig: string; dest: string } | null = null;

  /** Parse a piece character from a FEN string at the given square. */
  function fenPieceAt(fenStr: string, sq: string): string | null {
    const file = sq.charCodeAt(0) - 97; // 'a'=0
    const rank = parseInt(sq[1]) - 1;   // '1'=0
    const rankStr = fenStr.split(' ')[0].split('/')[7 - rank];
    let col = 0;
    for (const ch of rankStr) {
      const n = parseInt(ch);
      if (isNaN(n)) {
        if (col === file) return ch;
        col++;
      } else {
        col += n;
      }
      if (col > file) break;
    }
    return null;
  }

  function isPromotionMove(orig: string, dest: string): boolean {
    const piece = fenPieceAt(fen, orig);
    if (!piece) return false;
    if (piece === 'P' && dest[1] === '8') return true;
    if (piece === 'p' && dest[1] === '1') return true;
    return false;
  }

  function buildConfig(): Config {
    return {
      fen,
      orientation,
      turnColor: movableColor ?? 'white',
      viewOnly: viewOnly || pendingPromo !== null,
      lastMove: lastMove ? (lastMove as Key[]) : undefined,
      movable: {
        free: false,
        color: movableColor ?? 'both',
        dests: (dests as Dests | null) ?? undefined,
        showDests: true,
      },
      events: {
        move(orig: string, dest: string) {
          if (isPromotionMove(orig, dest)) {
            pendingPromo = { orig, dest };
            // Freeze board while dialog is open
            api?.set({ viewOnly: true });
          } else {
            onMove(orig, dest);
          }
        },
      },
      highlight: { lastMove: true, check: true },
      animation: { enabled: true, duration: 150 },
    };
  }

  onMount(() => {
    api = Chessground(el, buildConfig());
  });

  onDestroy(() => {
    api?.destroy();
    api = null;
  });

  // Reactive updates when props change
  $: if (api) {
    api.set({
      fen,
      orientation,
      turnColor: movableColor ?? 'white',
      viewOnly: viewOnly || pendingPromo !== null,
      lastMove: lastMove ? (lastMove as Key[]) : undefined,
      movable: {
        free: false,
        color: movableColor ?? 'both',
        dests: (dests as Dests | null) ?? undefined,
        showDests: true,
      },
    });
  }

  function handlePromoChoice(piece: 'q' | 'r' | 'b' | 'n') {
    if (!pendingPromo) return;
    const { orig, dest } = pendingPromo;
    pendingPromo = null;
    api?.set({ viewOnly: viewOnly });
    onMove(orig, dest, piece);
  }

  function handlePromoCancel() {
    if (!pendingPromo) return;
    pendingPromo = null;
    // Revert board to pre-move position
    api?.set({ fen, viewOnly: viewOnly });
  }
</script>

<div class="board-wrap board-theme-{_theme} pieces-{_pieces}">
  <div class="cg-wrap" bind:this={el}></div>
  {#if pendingPromo}
    <PromotionDialog
      color={movableColor ?? 'white'}
      onChoose={handlePromoChoice}
      onCancel={handlePromoCancel}
    />
  {/if}
</div>

<style>
  .board-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
  }

  .cg-wrap {
    width: 100%;
    height: 100%;
  }
</style>
