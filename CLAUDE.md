# Chesslovaquia — Agent Guide

**"One board to play them all"** — A standalone chess webapp with planned integrations for lichess.org and chess.com.

---

## Agent Instructions

- **Keep this file up to date.** Any time you discover a non-obvious pitfall, learn a project convention, or make a structural decision, add it to the relevant section of this file without waiting to be asked.
- **How to apply:** Treat CLAUDE.md updates as part of the definition of done for every task, the same as running `make test`.
- **Never run git commands.** The user owns all git operations — commits, branches, tags, pushes, merges, rebases, resets, stashes. Finish tasks at "code written to disk and verified"; do not stage or commit. If the user asks for a commit message, write it as text in the response, do not execute `git commit`. This applies to every task, without exception, even when a commit feels like the natural next step.
- **Work on whatever branch is checked out.** The rewrite is in progress — see `docs/plan.md`. Branch management is the user's decision, not the agent's; do not plan around future branch transitions or suggest them unprompted.
- **Ask questions just-in-time, not in a big up-front batch.** When a decision meaningfully shapes the next piece of work and the user is likely to have a preference (tooling choices, naming, data-shape details, UX trade-offs, defer-vs-do-now), pause and ask one question at the moment of acting on it — then wait for the answer before proceeding. Do not batch 5-10 questions at the start of a phase; answers are better when the code around them is concrete, and many up-front questions evaporate by the time they'd matter. Filter: "would the user have a real preference here?" Yes → ask. No → just do it and mention it in the reply so they can push back.

---

## Tool Use

- Prefer `Grep`, `Glob`, and `Read` directly for targeted searches — do not spawn subagents just to look something up
- Only use the `Agent` tool when the task genuinely requires unpredictable multi-step exploration (3+ search rounds that depend on each other)
- Subagent sessions multiply token costs; the default should always be direct tools first

---

## Project Overview

Chesslovaquia is a local-first chess PWA. It does two things: play chess (OTB, lichess, later chess.com) and consolidate game history across platforms. Full rewrite underway using Svelte + Vite + TypeScript (tayrax-style). See `docs/plan.md` for the full product description, data model, UI principles, and phase roadmap.

Current status: **Phase 2 complete** — lichess integration. OAuth PKCE multi-account (`lichess/auth.ts`); HTTP client with 429 retry (`lichess/client.ts`); NDJSON reconnecting stream (`lichess/stream.ts`); seek + live game + active-game reconnect (`lichess/play.ts`); game archive import (`lichess/history.ts`). Home page has OTB / lichess mode toggle. Settings page handles OAuth callback and history sync. Play.svelte handles both OTB and lichess modes. Phase 3 (chess.com import) is next.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| UI framework | Svelte 4 |
| Build tool | Vite 5 |
| Chess logic | chess.js 1.x |
| Board UI | @lichess-org/chessground 10.x |
| Styling | Plain CSS + custom properties, dark scheme |
| App type | PWA (hand-written `sw.js`, no Workbox) |
| Storage | IndexedDB (accounts, games, game state), localStorage (config, selection) |
| Tests | Vitest 2.x + jsdom + `@testing-library/svelte` |
| Containerization | Docker (Debian slim) |

Do not upgrade Vitest past 2.x while on Svelte 4 / Vite 5 — peer dependency conflict.

---

## Repository Layout

```
site/
├── src/
│   ├── lib/
│   │   ├── config.ts        # DB names, localStorage keys
│   │   ├── logger.ts        # logger singleton (debug gated on clvq.debug=1)
│   │   ├── db.ts            # Generic IndexedDB Store<T> wrapper
│   │   └── accounts.ts      # Account type, CRUD, Svelte stores, ensureGuest
│   ├── components/
│   │   └── AccountPicker.svelte
│   ├── App.svelte            # Home page
│   ├── Play.svelte           # /play/ (Phase 1)
│   ├── History.svelte        # /history/ (Phase 1)
│   ├── Settings.svelte       # /settings/
│   ├── main.ts / play.ts / history.ts / settings.ts
│   ├── sw.ts                 # Service worker (Vite rollup input, excluded from tsconfig)
│   ├── app.css               # Dark scheme + CSS custom properties
│   ├── vite-env.d.ts         # __APP_VERSION__ declaration + *.svelte module fallback
│   └── test-setup.ts         # fake-indexeddb/auto + @testing-library/jest-dom
├── static/                   # Vite publicDir — manifest.json, favicon.ico, clvq-192.png, clvq-512.png, lila/public/images/board/wood4.jpg
├── index.html, play/, history/, settings/
├── devtools/unregister-sw.html
├── vite.config.ts
├── vitest.config.ts
├── svelte.config.js
├── tsconfig.json + tsconfig.node.json
├── package.json
├── Makefile
├── Dockerfile
├── docker/
└── docs/
    └── plan.md               # Full rewrite plan and phase roadmap
```

---

## Build & Development

```bash
# Install deps (inside container)
npm install

# Development server
make dev  # or: npm run dev

# Production build
make build  # or: npm run build

# Run svelte-check + tests
make test  # or: npm run check && npm run test

# CI (npm ci + check + test)
make ci-check

# Docker image build (from host)
make docker
```

---

## Testing

- **Framework:** Vitest 2.x + jsdom + `@testing-library/svelte`
- **Test files:** `src/**/*.test.ts`
- **Setup:** `src/test-setup.ts` — imports `fake-indexeddb/auto` (patches global `indexedDB`) and `@testing-library/jest-dom`
- **IndexedDB:** `fake-indexeddb` auto-patched in test-setup; state persists within a test file, resets across files. Call `clearAll()` in `beforeEach` for any test that touches the store.

Always verify with `npm run check && npm run test` before calling a task done.

---

## Test Conventions

- **Keep tests in sync with source.** Every `src/lib/*.ts` file should have a matching `*.test.ts`. When adding a new exported function, add tests for it in the same PR. When removing or renaming an export, remove the corresponding tests.
- **One test file per source file, co-located.** Tests live next to the file they test (`src/lib/foo.ts` → `src/lib/foo.test.ts`). Do not consolidate tests across files.
- **What to skip.** `config.ts` (only constants) and `logger.ts` (thin `console.*` wrapper) are intentionally untested — no logic to exercise. Do not add tests for them unless logic is added. **Svelte components (`.svelte` files) are also intentionally untested.** Components in this project are thin wiring — they bind lib functions to events and render reactive state. All real logic lives in `src/lib/` and is tested there. Component tests would only exercise Svelte's own event dispatch and rendering machinery, at high setup cost (mounting, prop drilling, event simulation) for negligible regression value. Do not add component tests unless a component develops substantial internal logic that cannot be extracted to a lib module.
- **`Store<T>` (db.ts) is tested directly.** `src/lib/db.test.ts` covers `get`, `getAll`, `put`, `delete`, `clear` including edge cases (missing id, overwrite, no-op delete). Higher-level stores (`accounts`, `games`, `game-state`) test their own API, not `Store` internals — avoid re-testing `Store` behaviour through wrapper modules.
- **`beforeEach` isolation for IndexedDB tests.** Any test file that writes to a store must call the store's `clear()` or `clearAll()` in `beforeEach`. For `accounts.ts` tests, also reset the Svelte writable singletons (`accounts.set([])`, `selectedAccount.set(null)`) — they are module-level and persist across tests in the same file.
- **Test behavior, not implementation.** Assert on return values, thrown errors, and observable state changes. Do not reach into private fields or spy on internal methods unless there is no other observable way to verify the behavior.
- **Edge cases worth covering by default:** missing/not-found lookups return `undefined`; overwrite/upsert semantics; operations on empty stores are no-ops (no throws); state resets (e.g. `Engine.load()` clears `_status` set by `resign()`/`abort()`).
- **FEN assertions in engine tests** — prefer `toContain` on a known substring of the FEN over a full FEN equality check; full FENs are brittle because the half-move clock and full-move number change.
- **chess.js en passant FEN caveat** — chess.js only records the en passant square in the FEN when an opposing pawn is actually in position to capture. Do not assert `fen.includes('e3')` after `1.e4` without a black pawn on d4/f4.

---

## Data Model (Phase 0 — Accounts only)

```
Network = 'otb' | 'lichess' | 'chesscom'

Account {
  id: string               // crypto.randomUUID()
  network: Network
  displayName: string
  handle: string | null    // lichess/chess.com username; null for OTB
  credentials: { ... } | null   // lichess OAuth only
  createdAt: number
}
```

Full data model (Game, GameState) is in `docs/plan.md`.

---

## Conventions

- **Copyright headers** on every source file:
  - `.ts`: `// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>` + `// See LICENSE file.`
  - `.svelte`: `<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->` + `<!-- See LICENSE file. -->`
  - `.css`: `/* Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> */` + `/* See LICENSE file. */`
- **TypeScript strict mode.** No `any`, no implicit types. `noUnusedLocals` and `noUnusedParameters` are on.
- **Named exports** in `.ts` files. No default exports (except for Vite entry points that require `export default app`).
- **Business logic** (`lib/`) is never imported by build config files; only `src/` imports from `src/lib/`.
- **One responsibility per file.** Don't mix accounts with game state.
- **All logging** goes through `logger` from `src/lib/logger.ts`. Never call `console.*` directly. `logger.debug()` is gated on `localStorage.setItem('clvq.debug', '1')`. Only `logger.warn()` and `logger.error()` always output.
- **Storage keys are versioned:** DB name = `clvq.accounts.v1`, etc. localStorage keys in `src/lib/config.ts`. Bump DB name on schema change.

---

## UI Conventions

- **CSS custom properties** defined in `src/app.css` under `:root` — `--clvq-bg`, `--clvq-fg`, `--clvq-muted`, `--clvq-accent` (warm amber `#c9a14e`, primary interactive), `--clvq-accent-green`, `--clvq-accent-red`, `--clvq-accent-blue`, `--clvq-border`, `--clvq-surface`, `--clvq-surface-hover`, `--clvq-radius-sm` (4px), `--clvq-radius-md` (6px).
- **`--clvq-accent` vs `--clvq-accent-green`:** `--clvq-accent` (warm amber) is the primary interactive color — active tabs, selected states, primary action buttons, nav highlights, clock active border. `--clvq-accent-green` is semantically reserved for win result badges only (`History.svelte`). Never use `--clvq-accent-green` for interactive chrome.
- **Board highlight theme:** `src/board-wood4.css` overrides chessground's last-move and selected-square highlights with amber (`rgba(201, 161, 78, ...)`) to match the UI accent palette. Move-destination dots (`.move-dest`, `.oc.move-dest`) are intentionally left at the chessground default green — the default reads clearly on both the golden light squares and walnut dark squares of wood4, and custom colors (amber, steel blue, periwinkle) were tried and rejected. Imported in `play.ts` after `src/chessground.wood4.css` (the project's board theme file, which replaces `chessground.brown.css`).
- **Border radius hierarchy:** Use `--clvq-radius-sm: 4px` for small controls (buttons, inputs, chips). Use `--clvq-radius-md: 6px` for large card-level surfaces (`.account-row`, `.game-row`, `.game-over-banner`, dialogs). This creates visual hierarchy without introducing arbitrary values.
- **Piece color indicators:** Use `#f0d9b5` (light square) for white and `#b58863` (dark square) for black. These match chessground's default colors and `QuickSetup.svelte` for consistency across the app.
- **Confirmations instead of `window.confirm()`:** Replace modal confirms with inline two-step UIs (e.g., draw offer, account removal). First click sets a `confirming` state, second click executes. Add a `cancel` handler to reset the state. This is more discoverable and consistent with mobile UX.
- **Keyboard shortcuts guard:** When adding keyboard handlers to `svelte:window`, guard against INPUT/TEXTAREA/BUTTON targets to avoid hijacking browser focus. Check `(e.target as HTMLElement).tagName` and return early if focused on a form element.
- **Focus-visible for keyboard users:** Use `:focus-visible` (not `:focus`) for all interactive elements. This shows focus rings only for keyboard navigation, not mouse clicks. Remove `outline: none` from any `:focus` rule so the global style applies.
- **Animation durations:** Use 120ms for content transitions (fade between modes), 0.8s for pulsing alerts (clock low-time), 1.4s for loading states (seeking ellipsis). Keep transitions snappy; avoid long delays.
- **Loading state animations:** Use CSS `@keyframes` with `steps(4, end)` for discrete animations (e.g., ellipsis dots). This avoids JavaScript polling and scales well.
- **History result badges:** Small filled square badges (`1.1rem × 1.1rem`, `border-radius: var(--clvq-radius-sm)`, white text). Map PGN result codes to single characters: `+` on green (`.result-win`), `−` on red (`.result-loss`), `=` on muted gray (`.result-draw`), `×` on muted gray (`.result-aborted`). Always from White's perspective, consistent with chess.com/lichess conventions.
- **Play page has no global nav (`NavMenu`).** The play page maximizes board space — no nav bar, no home link. The only way to exit a game is through game actions: Abort (before move 2), Resign, or Offer Draw. Once the game ends, "New Game" returns to the home page. Never add navigation chrome (back links, home buttons, breadcrumbs) to `Play.svelte` or `GameBar.svelte`.
- **Play page action bar — single flat flex container.** All in-game buttons (abort/resign/draw + nav) live as direct children of `.info-panel` — no nested wrappers or sub-components. All buttons are `.action-btn` (2.2rem square icons). The `GameBar` component has been removed; its logic is inlined in `Play.svelte`. Do not reintroduce a wrapper component or nested flex containers.
- **Play page layout — portrait:** Four-row grid: `[opponent info] / [board] / [bottom player info] / [action bar]`. No `max-width` constraint — the board fills the full screen width edge-to-edge. No padding on `.play-layout`. Bottom player info and action bar blend together with no dividing border. `grid-template-rows: auto 1fr auto auto`.
- **Play page layout — landscape:** Four-column grid: `[opponent info] | [board] | [our info] | [action bar]`. `grid-template-columns: auto 1fr auto auto`. Board fills `100dvh` height. All four columns are vertical flex containers. Player info columns are narrow; action bar is a stacked column of buttons. No borders between columns — blended appearance consistent with portrait. The landscape rule applies at `@media (orientation: landscape) and (min-width: 700px)`.

---

## Common Pitfalls

- **`src/sw.ts` is excluded from `tsconfig.json`** (WebWorker globals conflict with DOM lib). It has `/// <reference lib="webworker" />` for IDE support and is built by Vite as a separate rollup input that emits `dist/sw.js`. `__APP_VERSION__` is substituted by Vite's `define`. Register in `main.ts` with `{ type: 'module' }`.
- **Svelte components without `<script lang="ts">`** — `vite-env.d.ts` has a `declare module '*.svelte'` fallback so TypeScript doesn't error on imports from plain template-only components.
- **`fake-indexeddb/auto`** patches the global `indexedDB` in `test-setup.ts`. State persists within a test file's run. Call the store's `clearAll()` in `beforeEach` to isolate tests.
- **`accounts` and `selectedAccount`** are module-level Svelte writable singletons — reset them with `.set([])` / `.set(null)` in `beforeEach` in addition to clearing the DB.
- **Multi-page Vite config** — entry points for `/`, `/play/`, `/history/`, `/settings/` are in `vite.config.ts`. Each has its own `index.html`. The `sw` entry uses `entryFileNames` override so it emits to `dist/sw.js` instead of `dist/assets/sw-[hash].js`.
- **chess.js 1.x en passant FEN** — after a double pawn push, chess.js only records the en passant square in the FEN if an opposing pawn is actually in position to capture. Don't assert `fen.contains('e3')` after 1.e4 without a black pawn on d4/f4.
- **chessground package** — use `@lichess-org/chessground` (current: 10.1.1). The old unscoped `chessground` package is deprecated at 9.2.1. CSS import order in `play.ts`: `chessground.base.css` → `src/chessground.wood4.css` (board theme, replaces `chessground.brown.css`) → `chessground.cburnett.css` (pieces) → `src/board-wood4.css` (amber highlight overrides). No `static/vendor/` directory — there is no vendor.sh. PromotionDialog renders pieces using chessground's own CSS classes (`.cg-wrap piece.queen.white`) so no external SVG files are needed.
- **chessground `Key` and `Dests` types** — chessground is strict about its `Key` type (a union of all 64 square strings). `Map<string, string[]>` is not assignable to `Dests`; cast with `(map as Dests)`.
- **Svelte template function calls hide reactive dependencies.** If you write `class:selected={isSelected(tc)}` where `isSelected` reads a reactive variable from the closure (e.g. `selectedTc`), Svelte's compiler only sees `tc` as a dependency — not `selectedTc` inside the function body. The class will never update when `selectedTc` changes. Fix: reference the reactive variable *directly* in the template expression, or use a `$:` reactive declaration (e.g. `$: selectedIndex = ...`) that is then referenced directly in the template. This applies to any function call in a template where the relevant reactive state is a closure variable rather than a direct argument.
- **Svelte `$:` declarations are not recomputed mid-function.** If you reassign a `let` variable inside a function and then read a `$:` declaration that depends on it in the same synchronous call, you get the *old* value. Example: after `moves = engine.history()`, reading `liveIndex` (declared `$: liveIndex = moves.length - 1`) still returns the pre-update value. Always compute derived values directly (`moves.length - 1`) rather than relying on the reactive variable inside the same function that triggered the change.
- **Svelte `$:` declarations do not track object mutations.** Svelte tracks variable *reassignments*, not mutations to object internals. `$: turn = engine.turn()` will never re-run because `engine` is always the same `const` reference — even though the engine's internal state changes with every move. For state derived from a mutable object (the chess engine), use plain `let` variables and update them explicitly after each mutation via a sync helper (e.g. `syncFromEngine()`). The same applies to any method call on a stable object reference.
- **Svelte 4, Vite 5, Vitest 2** — these three are pinned together. Vitest 3+ requires Vite 6+, which is incompatible with `@sveltejs/vite-plugin-svelte@3.x`. Do not upgrade any of the three independently.
- **`noUnusedParameters`** — any callback parameter that must be present for API shape but is not used should be prefixed with `_` (e.g. `_event`).
- **Lichess Board API time controls** — the Board API (`board:play` scope) only allows Rapid, Classical, and Correspondence. Bullet and Blitz are rejected. The home page lichess mode filters `QUICK_SETUPS` to `rapid | classical` buckets only.
- **Lichess seek vs event stream** — the `POST /api/board/seek` response body stays streaming-open while waiting for a match. The game ID arrives via `GET /api/stream/event` (`gameStart` event). `seekAndWait()` in `lichess/play.ts` opens both concurrently, aborts both once a `gameStart` arrives, and returns `{ gameId, color }`. AbortError from the seek POST after match is intentional — ignore it.
- **Lichess UCI move format** — the Board API uses UCI algebraic (`e2e4`, `e7e8q` for promotion), not SAN. Use `toUci(from, to, promotion?)` from `lichess/play.ts` to convert chess.js move results. Use `parseUci(uci)` to convert back to `{ from, to, promotion? }` for `engine.move()`.
- **Lichess opponent pseudo-account IDs** — for imported games (`lichess/history.ts`), the opponent is stored as `lichess:<handle>` in `whiteAccountId`/`blackAccountId` since we don't create Account records for opponents. `History.svelte`'s `accountName()` function handles this prefix by stripping it.
- **Lichess `LichessClient.token` is public** — intentionally, so `lichess/stream.ts` functions (which take a bare token) can be called from `lichess/play.ts` without coupling. Do not move it back to private.
- **Lichess game stream reconnect on reload** — `LS_LICHESS_ACTIVE` (`clvq.lichess.active`) stores `{ gameId, accountId, color }`. Play.svelte checks this on mount before trying OTB game state. Clear it with `clearActiveGame()` whenever the game ends (terminal gameState status) or the user navigates away from a finished game.
- **CSS media query overrides must come after the base rule.** In Svelte scoped styles, equal-specificity rules follow cascade order — the last one wins. If a `@media` block appears before the base class rule it's trying to override, the base rule will always win regardless of viewport. Always place `@media` overrides after the base rules they override.
