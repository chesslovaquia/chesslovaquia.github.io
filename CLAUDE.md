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

Current status: **Phase 4 complete** — consolidated stats. `lib/stats.ts` (pure functions over `Game[]`: `tally`, `recordByBucket`, `recordByColor`, `recordByNetwork`, `recordForAccount`, `openingFrequency`, `byDayOfWeek`, `byHourOfDay`, `rollingWindow`); `Stats.svelte` (tabbed Overview/Openings/Patterns/Trends page at `/stats/`, filterable by network/account/time-bucket/date-range); `components/BarChart.svelte` (small reusable SVG bar chart). `BottomTabs.svelte` is now a 4-column grid (Home/History/Stats/Settings). Opening frequency groups by bare ECO code only — no ECO→name table (OTB games have no ECO at all; a name lookup was deliberately deferred, see Common Pitfalls).

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
│   │   ├── accounts.ts      # Account type, CRUD, Svelte stores, ensureOtbAccounts
│   │   ├── games.ts         # Game type, IndexedDB store CRUD
│   │   ├── game-state.ts    # In-progress game IndexedDB persistence
│   │   ├── engine.ts        # chess.js wrapper (Engine class, GameStatus/GameResult)
│   │   ├── clock.ts         # Time control clock logic
│   │   ├── color.ts         # chess.js <-> chessground color conversion
│   │   ├── time-control.ts  # TimeControl bucket classifier + QUICK_SETUPS
│   │   ├── viewport.ts      # --clvq-vh tracking (100dvh Android workaround)
│   │   ├── stats.ts         # Phase 4 — pure W/L/D/opening/pattern/trend functions over Game[]
│   │   ├── lichess/         # Phase 2 — lichess.org integration
│   │   │   ├── auth.ts      # OAuth PKCE, multi-account
│   │   │   ├── client.ts    # HTTP client, bearer token, 429 retry
│   │   │   ├── stream.ts    # NDJSON reader w/ exponential-backoff reconnect
│   │   │   ├── play.ts      # Seek, live game stream, resign/abort, reconnect
│   │   │   └── history.ts   # PGN archive import, idempotent
│   │   └── chesscom/        # Phase 3 — chess.com import (no auth, no live play)
│   │       ├── client.ts    # Public archives API, 429 retry
│   │       └── import.ts    # Walks every monthly archive, idempotent by game URL
│   ├── components/
│   │   ├── BarChart.svelte     # Phase 4 — reusable horizontal bar chart (inline SVG, no library)
│   │   ├── Board.svelte
│   │   ├── BottomTabs.svelte   # Persistent bottom nav (Home / History / Stats / Settings); hidden on /play/
│   │   ├── Clock.svelte
│   │   ├── GameBar.svelte      # Resign / draw / abort action bar
│   │   ├── MoveList.svelte
│   │   ├── PromotionDialog.svelte
│   │   ├── Wordmark.svelte     # Stacked-emblem brand mark (knight glyph + amber rule + name)
│   │   └── home/
│   │       ├── BoardStrip.svelte     # Decorative blurred chequer behind the wordmark
│   │       ├── ModeSegmented.svelte  # OTB / Lichess mode toggle
│   │       ├── OrientationPicker.svelte  # Play as White / Random / Black
│   │       └── TimePresets.svelte    # Bucket-grouped time control chips
│   ├── App.svelte            # Home page
│   ├── Play.svelte           # /play/ — OTB + lichess live play
│   ├── History.svelte        # /history/ — unified OTB/lichess/chesscom list + filters
│   ├── Review.svelte         # /review/ — read-only game replay (?id=...)
│   ├── Settings.svelte       # /settings/ — accounts (OTB name, lichess, chess.com) + sync
│   ├── Stats.svelte          # /stats/ — tabbed W/L/D + openings + patterns + trends, filterable
│   ├── main.ts / play.ts / history.ts / review.ts / settings.ts / stats.ts
│   ├── sw.ts                 # Service worker (Vite rollup input, excluded from tsconfig)
│   ├── app.css               # Dark scheme + CSS custom properties
│   ├── vite-env.d.ts         # __APP_VERSION__ declaration + *.svelte module fallback
│   └── test-setup.ts         # fake-indexeddb/auto + @testing-library/jest-dom
├── static/                   # Vite publicDir — manifest.json, favicon.ico, clvq-192.png, clvq-512.png, lila/public/images/board/wood4.jpg
├── index.html, play/, history/, settings/, review/, stats/
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
- **Piece color indicators:** Use `#f0d9b5` (light square) for white and `#b58863` (dark square) for black. These match chessground's default colors across the app.
- **Confirmations instead of `window.confirm()`:** Replace modal confirms with inline two-step UIs (e.g., draw offer, account removal). First click sets a `confirming` state, second click executes. Add a `cancel` handler to reset the state. This is more discoverable and consistent with mobile UX.
- **Keyboard shortcuts guard:** When adding keyboard handlers to `svelte:window`, guard against INPUT/TEXTAREA/BUTTON targets to avoid hijacking browser focus. Check `(e.target as HTMLElement).tagName` and return early if focused on a form element.
- **Focus-visible for keyboard users:** Use `:focus-visible` (not `:focus`) for all interactive elements. This shows focus rings only for keyboard navigation, not mouse clicks. Remove `outline: none` from any `:focus` rule so the global style applies.
- **Animation durations:** Use 120ms for content transitions (fade between modes), 0.8s for pulsing alerts (clock low-time), 1.4s for loading states (seeking ellipsis). Keep transitions snappy; avoid long delays.
- **Loading state animations:** Use CSS `@keyframes` with `steps(4, end)` for discrete animations (e.g., ellipsis dots). This avoids JavaScript polling and scales well.
- **History result badges:** Small filled square badges (`1.1rem × 1.1rem`, `border-radius: var(--clvq-radius-sm)`, white text). Map PGN result codes to single characters: `+` on green (`.result-win`), `−` on red (`.result-loss`), `=` on muted gray (`.result-draw`), `×` on muted gray (`.result-aborted`). Always from White's perspective, consistent with chess.com/lichess conventions.
- **Bottom tab bar (`BottomTabs.svelte`):** Persistent bottom nav shown on Home, History, and Settings — never on `/play/`. Each page that uses it wraps content in a `.page-shell { height: var(--clvq-vh); display: grid; grid-template-rows: 1fr auto }` div, with `main { min-height: 0; overflow-y: auto }` to keep the tab bar pinned at the bottom. Active tab color is `--clvq-accent`; inactive is `--clvq-muted`. No SvelteKit `$app/stores` — active detection uses `window.location.pathname` (set once per page load).
- **Capped content width (`--clvq-page-width`, 600px):** All non-Play pages center their content in a 600px column on wide viewports instead of stretching edge-to-edge. The global `main { width: 100%; max-width: var(--clvq-page-width); margin: 0 auto }` rule in `app.css` covers `History.svelte`/`Settings.svelte`/`Review.svelte`, which all render a bare `<main>`. `App.svelte` has no `<main>` — its `.home-content` and `BottomTabs.svelte`'s `.tabs` replicate the same `width: 100%; max-width: var(--clvq-page-width); margin: 0 auto` trio by hand. If you add a new capped-width element, use all three properties together — see the pitfall below for why `width: 100%` can't be dropped.
- **Home page structure:** `.app-shell` (100dvh grid with 1fr + auto rows) wraps `.home-layout` (fills 1fr) and `<BottomTabs />` (auto). Inside `.home-layout`: `<BoardStrip />` is `position: absolute` (z-index 0); `.home-content` is the scrollable content column (z-index 1). The `<Wordmark>` sits in a 130px-tall `.home-header` at the top of `.home-content`. `BoardStrip` is 240px tall and fades to `--clvq-bg`.
- **Wordmark component:** Always use `<Wordmark>` for the app name display. Do not inline the knight glyph or wordmark text elsewhere. `size` prop scales all dimensions proportionally. `dropShadow` adds a text-shadow for legibility over the board strip.
- **Play page has no global nav.** The play page maximizes board space — no nav bar, no home link. The only way to exit a game is through game actions: Abort (before move 2), Resign, or Offer Draw. Once the game ends, "New Game" returns to the home page. Never add navigation chrome to `Play.svelte`.
- **Play page action bar — two groups.** Left group (`.action-bar__group`): game-state buttons (abort/resign, draw offer, or new-game after game ends). Right group: four nav buttons (first/prev/next/last). All buttons are `.action-bar__btn` (2.4rem square, inline SVG icons — no unicode glyphs). Confirm flows (resign, draw) temporarily replace the left group with `[label][✓][✕]`.
- **Play page layout — portrait:** Four-row grid: `"top" "board" "bottom" "actions"`. Safe-area insets via `env(safe-area-inset-*)` on `.play-layout`. Board is in `.board-area` (container-type: size) containing `.board-square` (min(100cqw, 100cqh) square). `grid-template-rows: auto 1fr auto auto; gap: 0`.
- **Play page layout — landscape:** Three-column × two-row grid: `"top board bottom" / "top board actions"`. Top player spans both rows of column 1; board spans both rows of column 2; bottom player in row 1 col 3; action bar in row 2 col 3. `grid-template-columns: minmax(120px, 18%) 1fr minmax(120px, 22%)`. Landscape rule applies at `@media (orientation: landscape)` (no min-width guard).

---

## Agent Environment Constraints

- **No browser available.** The agent runs in a minimal Docker container with no
  Chromium/Playwright binary and no display — do not attempt to install one
  (`playwright install`, `apt-get install chromium`, etc.) or try browser-automation
  skills (`chromium-cli`, `claude-in-chrome`) to visually verify UI changes. Verify
  frontend changes via `npm run check` + `npm run test`, and by reading the rendered
  component/markup change carefully. If a change genuinely needs visual/interactive
  confirmation, say so explicitly and let the user check it themselves — don't spend
  time trying to work around the missing browser.
- **Minimal shell.** Common process-inspection tools (`ps`, `pgrep`, `pkill`, `lsof`)
  are not installed. To find/stop a background process (e.g. a dev server started for
  a quick check), scan `/proc/[0-9]*/cmdline` for the command and `kill` the PID
  directly.

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
- **Chess.com's `eco` field on a game object is a URL** (e.g. `https://www.chess.com/openings/...`), not a bare ECO code — don't put it in `Game.openingEco`. The real code is in the embedded PGN's `[ECO "..."]` tag; `chesscom/import.ts`'s `parsePgnTag()` reads it from there instead.
- **Chess.com import does a full archive walk on every sync, by design** — the public archives API has no incremental cursor, so `chesscom/import.ts`'s `importUserGames()` re-fetches every monthly archive every time and dedupes by `sourceGameId` (the game's chess.com URL) against what's already stored. This was a deliberate simplicity-over-efficiency call (see `docs/plan.md` Phase 3) for a personal-scale game history — don't "optimize" it into a since-last-sync cursor without checking with the user first, since that trades correctness on backfilled/edited old games for fewer requests.
- **Chess.com `playedAt` is the game's end time**, not start time (`g.end_time * 1000`) — unlike lichess's importer, which derives `playedAt` from the PGN's `UTCDate`/`UTCTime` (closer to game start). Minor cross-source semantic drift; chess.com doesn't expose a reliable start timestamp on the archive game object.
- **Chess.com opponent pseudo-account IDs** — mirrors lichess: `chesscom:<handle>` in `whiteAccountId`/`blackAccountId` for opponents. `History.svelte`'s `accountName()` strips both `lichess:` and `chesscom:` prefixes.
- **A grid item with `margin: 0 auto` shrinks to its content width instead of stretching.** Grid items default to `justify-self: stretch` (fill the track), but *any* auto margin in that axis disables stretch and switches the item to shrink-to-fit sizing — so `max-width: 600px; margin: 0 auto` on a grid item (e.g. `<main>` inside `.page-shell`'s `1fr auto` grid, or `BottomTabs.svelte`'s `.tabs`) centers a box shrunk to its content's natural width, not a box filling up to 600px. Symptom: a capped-width element renders narrower than, and misaligned with, sibling elements that use the same `max-width` value. Fix: always pair `max-width: var(--clvq-page-width)` + `margin: 0 auto` with an explicit `width: 100%` (see `main` in `app.css`, `.home-content` in `App.svelte`, `.tabs` in `BottomTabs.svelte`). This bites any *new* grid-item child of `.page-shell`/`.app-shell` too, not just the ones already fixed.
- **`100dvh` is unreliable on some Android browsers/WebViews (e.g. MIUI).** Several devices compute `dvh` once against the largest possible viewport and don't recompute it live — page shells using `height: 100dvh` render taller than the actual visible screen on first paint, pushing `BottomTabs`/action bars off-screen until a scroll or resize forces a relayout. Fix: `src/lib/viewport.ts` (`initViewportHeight()`) tracks `window.innerHeight` in a `--clvq-vh` custom property, updated on `resize`, `orientationchange`, and `visualViewport` resize; called once per entry point (`main.ts`, `play.ts`, `history.ts`, `review.ts`, `settings.ts`) before mounting. All page-shell/layout rules use `height: var(--clvq-vh)` (fallback `100vh` defined in `app.css` `:root`) instead of `100dvh` directly. If you add a new full-height page shell, use `var(--clvq-vh)`, not `100dvh`.
- **CSS media query overrides must come after the base rule.** In Svelte scoped styles, equal-specificity rules follow cascade order — the last one wins. If a `@media` block appears before the base class rule it's trying to override, the base rule will always win regardless of viewport. Always place `@media` overrides after the base rules they override.
- **"Which color did I play?" is ambiguous and centralized in `lib/stats.ts`.** A `Game` only stores `whiteAccountId`/`blackAccountId`, not "which side is me." For OTB games, "me" is hardcoded to the fixed `OTB_USER_ID` account, never `Guest` — self-play games (Guest vs. User) would otherwise be ambiguous. For online games, "me" is whichever side is a locally-stored `Account` (the opponent is always a `lichess:<handle>`/`chesscom:<handle>` pseudo-account, never in the accounts store). `stats.ts`'s `perspectiveColor()`/`sideForAccount()`/`toPerspective()` implement this once; `History.svelte`'s inline `playerColor()` predates `stats.ts` and duplicates the same OTB/online logic — if you touch one, check whether the other needs the same fix.
- **Opening frequency has no ECO-to-name lookup, by design (Phase 4).** `stats.ts`'s `openingFrequency()` groups by bare ECO code (e.g. "C50") with an "unknown" bucket for games with no code — all OTB games, since `Play.svelte` always saves `openingEco: null`. Adding a name table was considered and deliberately deferred to keep to "no dependencies beyond the essentials"; revisit only if the user asks for opening names in the UI.
