# Chesslovaquia — Agent Guide

**"One board to play them all"** — A standalone chess webapp with planned integrations for lichess.org and chess.com.

---

## Agent Instructions

- **Keep this file up to date.** Any time you discover a non-obvious pitfall, learn a project convention, or make a structural decision, add it to the relevant section of this file without waiting to be asked.
- **How to apply:** Treat CLAUDE.md updates as part of the definition of done for every task, the same as running `make test`.

---

## Project Overview

Chesslovaquia is a Progressive Web App (PWA) built as a Hugo static site with TypeScript. Players can play chess locally with a full clock and game state, with the long-term goal of connecting to external platforms (lichess.org and chess.com) so players can use one board for both online and over-the-board games.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Site generator | Hugo (v0.128+) |
| Language | TypeScript 5.9+ |
| Chess logic | chess.js 1.4.0 |
| Board UI | Chessground 9.2.1 (lichess open source) |
| CSS framework | CSS custom properties (no framework) |
| Storage | IndexedDB (game state + history), sessionStorage (game setup), localStorage (config) |
| Test runner | Vitest 3.2.4 + happy-dom |
| Coverage | Istanbul |
| Containerization | Docker (Debian slim) |
| PWA | Service Worker + manifest.json |

---

## Repository Layout

```
site/
├── ts/                  # All TypeScript source
│   ├── clvq/            # Core framework: storage, errors, system info
│   ├── game/            # Game orchestration and state machine
│   │   ├── ChessGame.ts      # Main game class (entry point)
│   │   ├── GameState.ts      # IndexedDB persistence (moves + clock + orientation + description)
│   │   ├── GameHistory.ts    # Game history archive (IndexedDB Store.history)
│   │   ├── GameEngine.ts     # chess.js wrapper
│   │   ├── GameBoard.ts      # Chessground integration
│   │   ├── GameClock.ts      # Time controls
│   │   ├── GameMove.ts       # Move execution and validation
│   │   ├── GameNavigate.ts   # Move history navigation
│   │   ├── GameDisplay.ts    # UI updates
│   │   └── GamePromotion.ts  # Pawn promotion
│   ├── board/           # Board-level event handling
│   ├── engine/          # Chess engine abstraction (chess.js)
│   ├── config/          # DOM element discovery and validation
│   ├── events/          # Custom event definitions
│   ├── lichess/         # Lichess integration modules
│   │   ├── LichessAuth.ts    # OAuth2 PKCE authentication
│   │   ├── LichessClient.ts  # HTTP client with bearer token injection + 429 handling
│   │   ├── LichessStream.ts  # NDJSON stream reader with exponential backoff reconnect
│   │   ├── LichessGame.ts    # Game flow: seek, challenge, in-game actions, stream routing
│   │   ├── LichessHistory.ts # Fetch game history from lichess API, save to GameHistory
│   │   └── LichessError.ts   # Lichess-specific error class
│   └── testing/         # Vitest test files (*_test.ts)
├── js/                  # Plain JS: service worker, asset loader
├── hugo/                # Hugo build, dev, install scripts
├── themes/clvq1/        # Hugo theme (layouts, assets, CSS custom properties)
├── content/             # Hugo markdown pages
├── layouts/             # Top-level Hugo layouts
├── static/              # Images, icons, PWA manifest
├── config/              # Hugo configuration fragments
├── docker/              # Docker helper scripts
├── vendor/              # Scripts to pull vendor assets (lila.sh, fontawesome.sh)
├── docs/                # Project docs and TODO
├── hugo.toml            # Hugo main config
├── package.json         # npm scripts and dependencies
├── vitest.config.ts     # Vitest configuration
└── Dockerfile           # Multi-stage Docker build
```

---

## Architecture

### Module Hierarchy

```
Clvq (app entry point)
├── LichessAuth   → OAuth2 PKCE authentication (lichess.org)
└── ChessGame (game orchestrator)
    ├── GameState     → IndexedDB persistence
    ├── GameEngine    → chess.js (move validation, FEN, game status)
    ├── GameBoard     → Chessground (board rendering, user input)
    ├── GameClock     → Time controls (rapid, correspondence)
    ├── GameMove      → Move execution and legality
    ├── GameNavigate  → Move history traversal
    ├── GameDisplay   → DOM/UI updates
    └── GamePromotion → Pawn promotion dialog
```

### Key Patterns

- **Dependency injection** — `GameDeps` type supplies all module dependencies to `ChessGame`; this makes mocking in tests straightforward.
- **Event-driven** — Custom DOM events (`EventBoardMove`, `EventClockTimeout`) decouple modules.
- **Interface-based** — Abstract interfaces for `GameBoard`, `GameEngine`, `GameState` allow swapping implementations.
- **Early config validation** — `ConfigGameUI` / `ConfigGamePlayer` discover and validate DOM elements at init, throwing `ConfigError` immediately for missing elements.
- **Strict error hierarchy** — `ClvqError`, `GameError`, `EngineError`, `ConfigError`, `LichessError` extend a common base.

---

## Build & Development

```bash
# Install Hugo and npm dependencies
make deps

# Development server (Hugo with live reload)
./hugo/devel.sh

# Production build
npm run build
# or
make build

# Run all checks (lint, validate, test)
make check

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Clean build artifacts
make clean
```

Hugo TypeScript assets are served via module mounts defined in `hugo.toml`. The TypeScript is compiled by Hugo's asset pipeline (not tsc directly).

---

## Testing

- **Framework:** Vitest + happy-dom
- **Test files:** `ts/testing/**/*_test.ts`
- **Mocking helpers:** `mockGameDeps()`, `mockConfigGameUI()` (in `ts/testing/`)
- **IndexedDB:** `fake-indexeddb` package used in all tests
- **Coverage:** Istanbul HTML report, covers `ts/**/*.ts` excluding test files

Always run `make test` before committing. It covers TypeScript, HTML, CSS, and shell script validation plus the full test suite. This is the final gate for any modification — all changes must pass `make test` before they are considered done. Set `CLVQ_ROOT=http://localhost` when running locally (e.g. `CLVQ_ROOT=http://localhost make test`).

**Checking results:** `make test` produces verbose output — do not try to read it line by line to judge success. Always check the exit code: run it as `CLVQ_ROOT=http://localhost make test; echo "EXIT: $?"` and look for `EXIT: 0`. If it fails, run `npx vitest run` directly to get a focused test failure report.

---

## External Integrations (Current Status)

| Platform | Status | Notes |
|---|---|---|
| lichess.org | Partial | Chessground board component is from lichess; board textures sourced from lila repo |
| chess.com | Planned | No API integration yet |
| lichess API | Phases 1–6 done | OAuth2 PKCE auth (`LichessAuth`); HTTP client with token injection + 429 handling (`LichessClient`); NDJSON streaming with reconnect (`LichessStream`); game flow — seek, challenge, resign, draw, takeback (`LichessGame`); board integration — `LichessGameState`, `EventOpponentMove`, `EventGameOver`, `GameClock.syncTimes()`, `ChessGame` online-mode wiring (`onMove`, `playerColor`, `doOpponentMove`); UI — seek modal, challenge modal, opponent info panel, game actions bar (abort/resign/draw); game history — `GameHistory` (IndexedDB), `LichessHistory` (fetch from API), PGN export via `Clvq.exportPgn()`, history modal |
| chess.com API | Planned | No OAuth or API calls implemented yet |

The app is currently fully standalone for game play. Lichess Phases 1–6 are complete.

---

## Feature Roadmap (from docs/TODO.md)

- [ ] User preferences storage
- [ ] Save and retrieve game history
- [ ] PGN import/export
- [ ] Game analysis tools
- [ ] lichess.org API integration (play online)
- [ ] chess.com API integration (play online)

---

## Conventions

- **PascalCase** for classes and types; **camelCase** for methods and variables.
- Color conversion between `EngineColor` ('w'/'b') and `BoardColor` ('white'/'black') must go through `toBoard()` / `toEngine()` from `ts/engine/ColorUtils.ts`. Use `BySide<T>` (also from `ColorUtils.ts`) instead of `Record<EngineColor, T>` for side-keyed maps. Never write inline ternaries for these conversions.
- No framework (React/Vue/etc.) — plain TypeScript with direct DOM manipulation.
- Hugo handles the build pipeline; avoid bypassing it with raw `tsc` calls.
- Test files live in `ts/testing/`, named `<Subject>_test.ts`.
- Copyright headers required on all source files.
- Responsive layout: `content/play.md` uses `layout: game`; the `clvq1` theme provides a single CSS grid layout (`page/game.html`) that handles both desktop and mobile. `GameSetup.newGame()` and `setup.ts` navigate to `/play/` directly via `window.location.assign('/play/')`.

### HTML & Layouts

- **Sidebar navigation:** `baseof.html` conditionally includes `sidebar.html` (left sidebar) and `sidebar-toggle.html` (mobile hamburger) on non-game pages. The game page (`gamePage: "load"`) hides the sidebar entirely and omits the `.page-content` offset — the game has its own controls. `global-modals.html` (error, seek, history modals) is always included.
- **Sidebar contents:** Horse icon (home link), `site.Menus.main` nav links, "Play on Lichess" / "History" buttons, lichess auth section. Lichess auth IDs (`lichessLogin`, `lichessLogout`, `lichessUser`) live in `partials/sidebar.html`.
- **Sidebar CSS:** `.sidebar` is fixed left, 220px wide, hidden on mobile via `transform: translateX(-100%)`, shown with `.active` class. Always visible on desktop (`@media min-width: 768px`). `.sidebar-toggle` hamburger is hidden on desktop.
- **Game page layout:** `game/menu.html` is now a simple description bar (`.game-description-bar`) — no dropdown. Game action buttons (Reset, Abort, Resign, Offer Draw) live in `game/controls.html` below the nav buttons.
- **Modals:** Page-global modals (error, seek, history) are in `global-modals.html` via `baseof.html`. Game-specific modals (promotion, outcome, challenge, setup-custom) remain in `game/modals.html`.
- Hugo partials live in `themes/clvq1/layouts/partials/`. Game UI is split into `game/` (description bar, players, controls, status) and `modal/` (promotion, outcome, setup, errors).
- CSS architecture: `variables.css` (design tokens), `reset.css`, `layout.css` (CSS grid + `.page-content` sidebar offset), `components.css` (sidebar, modals, buttons), `game.css` (board sizing, clock states). Design tokens include `--clvq-font-mono`, `--clvq-font-xl`, `--clvq-transition`, `--clvq-clock-inactive`; clock display uses monospace/tabular-nums at 1.5rem with colour transitions.
- Home page (`_default/home.html`) includes time-control buttons via `partials/game/setup-buttons.html`.
- Modal system uses `.active` class toggle with CSS `opacity: 0; visibility: hidden` transitions in `components.css`. Sidebar uses the same `.active` toggle via `w3ToggleMenu`.
- The `id=` attributes in HTML templates are the source of truth for DOM element IDs — they must match the `ElementIds.*` constants in `ts/clvq/ElementIds.ts` exactly.
- Modal-specific JS (slider listeners, submit handlers) is written as inline `<script>` blocks directly inside the partial — this is the established pattern for `modal/` partials.
- The pawn promotion modal uses Chessground's non-standard `<piece>` element for piece rendering — this is intentional and passes HTML validation via `.htmlvalidate.json` configuration.

---

## Common Pitfalls

- Hugo's asset pipeline compiles TypeScript — do not add a separate `tsconfig.json` build step.
- `ConfigGameUI` validates DOM elements at init; tests must provide a complete mock DOM. Use `setupGameTestDOM()` from `ts/testing/testing.ts` in `beforeEach` — do not call `document.body.innerHTML = mockConfigGameUI()` directly. For lichess UI tests use `setupLichessTestDOM()`. If a test needs extra DOM elements on top (e.g. `GamePromotion_test.ts`), append them with `document.body.innerHTML += '...'` after `setupGameTestDOM()`.
- `GameState.save()` returns `Promise<void>` and has an internal `try/catch` that never re-throws. Sync callers fire-and-forget it with `.catch((err: unknown) => logger.error('State save error:', err))` for consistency; async callers `await` it. Either way, state is not persisted synchronously — don't assume it is after the call returns.
- `GameState.load()` is async (reads from IndexedDB). On load, moves are replayed one at a time via `engine.setState(moves, afterEach)` — the callback rebuilds `GameNavigate` positions and `GameCaptures` state from the engine at each step. Nav/captures state is not persisted; it is derived from the move list.
- `GameSetup` uses `sessionStorage` (key `clvq.setup`) to pass time control configuration from the home page to the game page during navigation. Setup data only persists within the browser tab session. The actual game state (moves, clock, orientation, description) is persisted in IndexedDB by `GameState` — this is what survives page reloads and tab closures. `GameNavigate` and `GameCaptures` do not persist their state; they are rebuilt from the move list on load.
- `fake-indexeddb` must be imported in test setup (`ts/testing/testing-setup.ts`) before any storage code runs.
- Never use raw string IDs in `document.getElementById()` — always use `ElementIds.*` from `ts/clvq/ElementIds.ts`.
- `ChessGame` registers static event listeners (`EventBoardMove`, `EventClockTimeout`) in the constructor. Call `destroy()` before reinitializing a game instance to prevent listener stacking.
- Board textures and Chessground CSS are vendored via `vendor/lila.sh` — do not edit them directly.
- `LichessAuth` uses `window.location` directly; tests must use `vi.stubGlobal('location', ...)` + `vi.unstubAllGlobals()` in `afterEach` to avoid leaking location mocks across test files. The `redirect(url)` method is `protected` specifically to allow `vi.spyOn` in tests.
- Any test that reads or writes `window.location.pathname` must use `vi.stubGlobal('location', { search: '', pathname: '...', href: '', assign: vi.fn() })` — direct assignment (`window.location.pathname = '...'`) is a silent no-op on happy-dom's real `Location` object. When another test file in the same vmThreads worker has previously called `vi.unstubAllGlobals()`, the real Location is restored and bare assignment stops working, causing intermittent failures as the number of test files (and therefore worker assignments) changes.
- **Modal/menu system:** `w3ShowModal`/`w3HideModal`/`w3ToggleMenu` in `ts/clvq/utils.ts` toggle the `.active` CSS class. `.modal-container` and `.game-dropdown` use `opacity: 0; visibility: hidden` — `.active` makes them visible. The pawn promotion modals are a special case: TypeScript sets `style.display = 'block'/'none'` directly — they must start with `style="display:none"` inline, not `class="modal-container"`.
- **Fontawesome path:** Vendored fontawesome CSS must live at `themes/clvq1/assets/fontawesome/css/` so that the `url("../webfonts/fa-solid-900.woff2")` reference in `solid.css` resolves correctly to `static/fontawesome/webfonts/fa-solid-900.woff2`. Do NOT place theme assets in the root-level `assets/` directory — Hugo's virtual FS only includes explicitly mounted paths (see `[[module.mounts]]` in `hugo.toml`), so root `assets/` is invisible to the pipeline.
- **css_load:** `params.css_load` is defined in the theme's `config.yaml` (`themes/clvq1/config.yaml`). Hugo's config merge uses the theme's list as the default since the site-level config (`config/_default/config.yaml`) does not define `css_load`. Theme CSS lives in `themes/clvq1/assets/`; chessground CSS comes from the site-level module mount (`node_modules/chessground` -> `assets/chessground`). JS/TS params (`js_load`, `game_ts`, `sw_js`, etc.) are shared and live in `config/_default/config.yaml`.
- `ClvqIndexedDB<T>` is generic and versioned (`dbVersion`). Always specify the value type at construction: `new ClvqIndexedDB<StateData>(Store.state)`, `new ClvqIndexedDB<HistoryRecord>(Store.history)`. Use `ClvqIndexedDB<unknown>` only in tests that exercise DB mechanics rather than type safety. Adding a new `Store` enum value auto-creates the store on upgrade because `upgrade()` iterates `Object.values(Store)`. Bump `dbVersion` whenever the schema changes.
- `GameHistory` tests must call `new ClvqIndexedDB<HistoryRecord>(Store.history).clearAll()` in `beforeEach` — IndexedDB is shared across all test files via `fake-indexeddb`. Likewise, `LichessHistory` tests must mock `GameHistory.prototype.save` to prevent cross-test contamination.
- `LichessGameState` implements `GameState` — any new method added to the `GameState` interface must also be added to `LichessGameState` (and `TestGameState` in `testing.ts`).
- Shared test mock factories live in `ts/testing/testing.ts`: `mockLichessAuth()`, `mockLichessClient()`, `mockLichessGame()` (returns `{ game, cbs }` where `cbs` captures registered callbacks), and `setupLichessTestDOM()`. Do not redefine these locally in new test files — import them from `testing.ts`.
- `ChessGame.saveHistory()` is only called for local games (`!this.onMove`). Online lichess games are retrieved via `LichessHistory.fetchGames()` — do not double-save them.
- `engine.pgn(headers)` calls chess.js `setHeader()` which mutates the Chess instance. Headers persist across subsequent `pgn()` calls on the same instance. This is fine for `saveToHistory()` since it only runs once per game.
- chess.js 1.x `Chess.move(san)` **throws** `Error` for invalid moves — it does not return null. Always wrap calls in a try-catch when move validity is uncertain; do not rely on a falsy return value.
- All NDJSON parsing for lichess streams goes through `ts/lichess/NdjsonReader.ts` (`readNdjson<T>`). Use `onError: 'throw'` for live streams (throws `LichessError`) and `onError: 'skip'` for batch history fetches. Do not add inline decode/parse loops to new lichess classes.
- Lichess stream event routing in `LichessGame.ts` uses `StreamEvent &` intersection types plus type guard functions instead of `as unknown as` casts. Adding a new event type requires both a variant type (e.g. `type FooStreamEvent = StreamEvent & { type: 'foo'; ... }`) and a corresponding `isFooEvent` guard. `LichessStream.ts` keeps its `[key: string]: unknown` index signature — do not remove it; it is required for test call sites that spread typed objects into `StreamEvent`.
- `ChessGame.destroy()` calls `clock.stop()` to clear intervals. Tests that call `game.init()` (which may invoke `clock.start()`) must call `game.destroy()` in `afterEach` — otherwise the `setInterval` leaks into later test files sharing the same vmThreads worker, corrupting happy-dom's event routing and causing intermittent failures in unrelated tests.
- `vi.useFakeTimers()` must be active in any test that starts the game clock. Use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach` (after `game.destroy()`). This prevents real `setInterval` callbacks from firing after tests end.
- Never replace `global.document` in a test file (e.g. with a custom `new Window()`). Vitest's `vmThreads` pool shares globals across VM contexts in the same worker thread. Replacing `global.document` at module level corrupts the event targets used by other test files, causing intermittent `EventGameOver`/`EventOpponentMove` dispatch failures. Use the default happy-dom environment instead.
- `make test` runs `npx tsc --noEmit` via `ts/check.sh`. The tsconfig target is `es2019` — avoid methods introduced after ES2019 (e.g. `Array.at()` requires ES2022+). Use `arr[arr.length - 1]` instead of `arr.at(-1)`. Test files that import Node.js built-ins (`fs`, `path`, etc.) require `/// <reference types="node" />` at the top of the file since the tsconfig has no explicit `types` array.
- happy-dom tries to load `<link>` stylesheets and `<script src>` files referenced in the DOM, producing `NetworkError` noise in test output. This is suppressed via `vitest.config.ts` `environmentOptions.happyDOM.settings`: `disableCSSFileLoading: true`, `disableJavaScriptFileLoading: true`, `handleDisabledFileLoadingAsSuccess: true`. The third flag is required — without it, happy-dom throws `NotSupportedError` instead of silently succeeding.
- All logging goes through the `logger` singleton from `ts/clvq/Logger.ts` — never call `console.debug/warn/error/log` directly. `logger.debug()` is suppressed unless the user sets `localStorage.setItem('clvq.debug', '1')` in the browser. `logger.warn()` and `logger.error()` always output. Import the singleton as `import { logger } from '../clvq/Logger'` (adjust relative path as needed). Tests for `Logger` itself use `vi.spyOn(console, ...)` directly on `new Logger()` instances, not on the exported singleton.
