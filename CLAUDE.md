# Chesslovaquia — Agent Guide

**"One board to play them all"** — A standalone chess webapp with planned integrations for lichess.org and chess.com.

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
| CSS framework | w3.css |
| Storage | IndexedDB (games), localStorage (config) |
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
│   │   ├── GameState.ts      # IndexedDB persistence
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
│   └── testing/         # Vitest test files (*_test.ts)
├── js/                  # Plain JS: service worker, asset loader
├── hugo/                # Hugo build, dev, install scripts
├── themes/clvq/         # Hugo theme (layouts, assets, static)
├── content/             # Hugo markdown pages
├── layouts/             # Top-level Hugo layouts
├── static/              # Images, icons, PWA manifest
├── config/              # Hugo configuration fragments
├── docker/              # Docker helper scripts
├── vendor/              # Scripts to pull vendor assets (lila.sh, w3css.sh)
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
- **Strict error hierarchy** — `ClvqError`, `GameError`, `EngineError`, `ConfigError` extend a common base.

---

## Build & Development

```bash
# Install Hugo and npm dependencies
make deps

# Development server (Hugo with live reload)
npm run dev
# or
make dev

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

Always run `make check` before committing. It covers TypeScript, HTML, CSS, and shell script validation plus the full test suite.

---

## External Integrations (Current Status)

| Platform | Status | Notes |
|---|---|---|
| lichess.org | Partial | Chessground board component is from lichess; board textures sourced from lila repo |
| chess.com | Planned | No API integration yet |
| lichess API | Planned | No OAuth or API calls implemented yet |
| chess.com API | Planned | No OAuth or API calls implemented yet |

The app is currently fully standalone. All game state lives in the browser (IndexedDB). External platform integrations are the primary planned extension.

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
- No framework (React/Vue/etc.) — plain TypeScript with direct DOM manipulation.
- Hugo handles the build pipeline; avoid bypassing it with raw `tsc` calls.
- Test files live in `ts/testing/`, named `<Subject>_test.ts`.
- Copyright headers required on all source files.
- Responsive layouts: separate desktop (`play/desktop.md` → `game-desktop.html`) and mobile (`play/mobile.md` → `game-mobile.html`) pages; desktop is a 50/50 `w3-half` split, mobile is a vertical stack.

### HTML & Layouts

- Hugo partials live in `themes/clvq/layouts/partials/`. Game UI is split into `game/` (navbar, players, status) and `modal/` (promotion, outcome, setup, errors).
- The `id=` attributes in HTML templates are the source of truth for DOM element IDs — they must match the `ElementIds.*` constants in `ts/clvq/ElementIds.ts` exactly.
- Use only documented w3.css classes. For layout needs not covered by w3.css (e.g. flexbox), use an inline `style=` or add a class to `themes/clvq/assets/css/clvq.css` — do not invent w3.css class names.
- Modal-specific JS (slider listeners, submit handlers) is written as inline `<script>` blocks directly inside the partial — this is the established pattern for `modal/` partials.
- The pawn promotion modal uses Chessground's non-standard `<piece>` element for piece rendering — this is intentional and passes HTML validation via `.htmlvalidate.json` configuration.

---

## Common Pitfalls

- Hugo's asset pipeline compiles TypeScript — do not add a separate `tsconfig.json` build step.
- `ConfigGameUI` validates DOM elements at init; tests must provide a complete mock DOM via `mockConfigGameUI()`.
- `GameState.save()` returns `Promise<void>` — callers that fire-and-forget it are fine for autosave, but don't assume state is persisted synchronously after the call returns.
- `GameState.load()` and `setSetupData()` are both async; always `await` them in sequence to avoid race conditions.
- `fake-indexeddb` must be imported in test setup (`ts/testing/testing-setup.ts`) before any storage code runs.
- Never use raw string IDs in `document.getElementById()` — always use `ElementIds.*` from `ts/clvq/ElementIds.ts`.
- `ChessGame` registers static event listeners (`EventBoardMove`, `EventClockTimeout`) in the constructor. Call `destroy()` before reinitializing a game instance to prevent listener stacking.
- Board textures and Chessground CSS are vendored via `vendor/lila.sh` — do not edit them directly.
