# Chesslovaquia — Rewrite Plan

A full rewrite of chesslovaquia from the ground up, using the stack and
patterns validated in the `tayrax` project. The current Hugo-based codebase
is not being migrated — non-UI design ideas (class boundaries, color
conversion discipline, error hierarchy) may be reused as reference, but no
code is carried over.

**Repo strategy:** rewrite in place on the branch the user has
checked out (currently `v1/main`). The first scaffolding step deletes
everything except `.git`, `LICENSE`, `README.md`, the top-level
`.gitignore`, and `docs/plan.md` (plus any docs that remain relevant
— Hugo-era notes get dropped). CI workflows are scoped to whichever
branch the agent is working on. Decisions about when (or whether) to
merge, rename, or swap branches are the user's, not the agent's — the
agent works on whatever branch is checked out and does not plan
around future branch transitions.

**Git workflow — for the agent:** the agent does **not** run any git
commands. No `git commit`, no `git add`, no `git branch`, no `git
checkout`, no `git push`, no `git tag`, no `git merge`, no `git
rebase`, no `git reset`, no `git stash`. The user handles all git
operations themselves. The agent's job ends at "code written to disk
and verified"; commits, branch management, and pushes are the user's
domain. This applies even when a task feels "complete" and a commit
would be natural — stop at the file edits and let the user take it
from there. If the user asks for help composing a commit message,
write the message as text in the response; do not run `git commit`.

**Decision rhythm — just-in-time, not up-front:** throughout the
plan's implementation, when the agent has a question whose answer
meaningfully shapes the next piece of work (tooling choice, naming,
data-shape detail, UX trade-off, defer-vs-do-now, etc.), it **asks
one question at the moment it's about to act on the answer** — not
in a big batched list at the start of a phase. The user prefers to
answer questions in context: the answer is better when the code
around it is concrete, and half of the up-front questions evaporate
by the time they'd matter. The pattern is: agent is about to make a
choice the user cares about → agent pauses, asks, waits for the
answer, then proceeds. Questions the agent can confidently answer
itself (code style mechanics, obvious best practices, things already
decided in this plan or CLAUDE.md) stay internal — don't ask for
confirmation on every tiny decision either; the filter is "would the
user have a real preference here?" If the answer is yes, ask. If no,
just do it and mention it in the reply so the user can push back.

---

## Product Description

Chesslovaquia is a local-first chess PWA that does two things well:

1. **Play chess** — over the board, on lichess.org, and (later) via imports
   from chess.com. The board is the focal point; everything else exists to
   support the game in progress.
2. **Consolidate your game history across networks** — one place to see
   every game you've played, regardless of where you played it, with stats
   sliced across all of it.

The second capability is the differentiator. Neither lichess nor chess.com
can show you your games from the other site, and neither supports multiple
accounts as a first-class concept. A local-first PWA is the natural home
for that data because it has to land somewhere neutral.

No slogan. The description above stands on its own.

---

## Non-Goals

- No backend, no server, no account on our side — runs entirely in the
  browser.
- No "unified rating" computation that mixes lichess and chess.com ratings
  into a single number. Those rating systems are not comparable; any
  formula we pick would be fake. Descriptive stats only, until there's
  enough real data to justify something more.
- No training suite, no puzzles, no opening trainer, no study imports.
  Scope creep is the main risk in a personal tool; the app plays games
  and consolidates history, full stop, until that core is solid.
- No CSS framework (Tailwind, Bootstrap, etc.). Plain CSS with custom
  properties, as in tayrax.
- No UI framework other than Svelte. No React, Vue, Solid, etc.
- No dependencies beyond the essentials: `chess.js`, `chessground`,
  `svelte`, `vite`, `vitest`. Additions require a clear reason.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| UI framework | Svelte 4 |
| Build tool | Vite 5 |
| Chess logic | chess.js 1.x |
| Board UI | Chessground 9.x (wrapped in a thin Svelte component) |
| Styling | Plain CSS + custom properties, dark color scheme |
| App type | PWA (Service Worker + manifest) |
| Storage | IndexedDB (games, accounts, game state), localStorage (config, last-used account) |
| Tests | Vitest 2.x + jsdom + `@testing-library/svelte` |
| Hosting | GitHub Pages (tag-driven release workflow, mirroring tayrax) |

This mirrors tayrax deliberately. Do not upgrade Vitest past 2.x while on
Svelte 4 / Vite 5 — see the tayrax CLAUDE.md for the rationale.

---

## Data Model

Accounts are first-class from day one. Even if only OTB is wired in
Phase 1, the shape must exist so later phases plug in without schema
migrations.

```
Network  = 'otb' | 'lichess' | 'chesscom'

Account {
  id: string                  // stable local UUID
  network: Network
  displayName: string         // user-chosen label
  handle: string | null       // lichess username / chess.com username / null for OTB
  credentials: {              // lichess only
    accessToken: string
    refreshToken: string | null
    expiresAt: number | null
  } | null
  createdAt: number
}

Game {
  id: string                  // stable local UUID
  source: Network
  sourceGameId: string | null // lichess game id / chess.com archive ref / null for OTB
  whiteAccountId: string      // FK to Account
  blackAccountId: string      // FK to Account
  pgn: string                 // full PGN with headers — raw, never lossy
  result: '1-0' | '0-1' | '1/2-1/2' | '*'
  timeControlBucket: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'correspondence'
  timeControlRaw: { initialSec: number; incrementSec: number } | null
  openingEco: string | null   // derived at import, cached
  playedAt: number
  importedAt: number
}

GameState {                   // in-progress game only — one at a time
  gameId: string              // matches Game.id once finished
  moves: string[]             // SAN
  clock: { white: number; black: number; lastTickAt: number } | null
  orientation: 'white' | 'black'
  whiteAccountId: string
  blackAccountId: string
}
```

**Principles:**

- **Store raw, not derived.** Keep full PGN on every game. Every derived
  metric (opening, time bucket, blunder rate later) can be recomputed;
  data you discarded cannot be recovered.
- **Normalize lookup axes, not values.** Time control goes into a
  bucket; result is always `1-0 / 0-1 / 1/2-1/2`. This lets us slice the
  data without schema churn.
- **Version every persisted schema.** IndexedDB store names carry a
  version suffix; bump on schema change, never mutate in place.

---

## UI Principles

- **Board at the center, everything else at the edges.** On portrait
  screens (phones) the board fills the width, info stacks above and
  below. On landscape screens (laptops, tablets) the board fills the
  height, info sits to one side. CSS grid with a single responsive
  breakpoint handles both cases.
- **Quick-setup buttons on the home page.** One click per common time
  control (bullet / blitz / rapid / classical / correspondence + a few
  popular increments). Plus a "custom" option and an account picker.
- **Dark color scheme by default.** Tayrax's palette as the starting
  point (`#111` background, `#eee` text, accent greens and reds for
  up/down, muted grays). Chess-specific accents (board squares, piece
  highlights) tuned separately.
- **Board theme defaults to lichess-style** (brown squares + cburnett
  pieces), with the theming machinery in place from day one so
  alternatives can be added cheaply. Board assets are vendored from
  the lila repo via a small `vendor.sh` script — same pattern as the
  current clvq's `vendor/lila.sh`, only the parts we need (a handful
  of CSS files + one or two piece sets) get pulled. User preferences
  (`clvq.board.theme`, `clvq.board.pieces`) live in localStorage;
  `Board.svelte` applies them as class names on the root element, no
  remount on change. A custom "chesslovaquia dark" theme is Phase 4+
  nice-to-have, not a Phase 1 commitment.
- **Minimal chrome.** No persistent sidebar. Sidebar-less layout on the
  game page (as in current clvq). A small top bar with app name +
  account indicator + menu button. Everything else on-demand.
- **No modals unless necessary.** Promotion needs one (chessground
  requirement). Game setup custom options can be inline. Game-over can
  be a non-blocking banner.
- **Account picker defaults to last-used.** First-time users see it;
  returning users don't, unless they open it themselves.

---

## Repo Layout (target)

Mirrors tayrax exactly, adjusted for chess:

```
site/
├── src/
│   ├── lib/
│   │   ├── config.ts              # constants, storage keys, buckets
│   │   ├── accounts.ts            # Account store, CRUD, persistence
│   │   ├── games.ts               # Game store, import, query, stats
│   │   ├── game-state.ts          # In-progress game persistence
│   │   ├── engine.ts              # chess.js wrapper
│   │   ├── clock.ts               # Time control logic
│   │   ├── pgn.ts                 # PGN parse/serialize/normalize helpers
│   │   ├── opening.ts             # ECO table + lookup
│   │   ├── time-control.ts        # Bucket classifier
│   │   ├── lichess/               # Phase 2
│   │   │   ├── auth.ts            # OAuth PKCE, multi-account
│   │   │   ├── client.ts          # HTTP client, token per account
│   │   │   ├── stream.ts          # NDJSON reader w/ reconnect
│   │   │   ├── play.ts            # Seek, challenge, live game
│   │   │   └── history.ts         # Archive fetch
│   │   ├── chesscom/              # Phase 3
│   │   │   ├── client.ts          # Public archives API
│   │   │   └── import.ts          # Archive fetch + PGN ingest
│   │   └── stats.ts               # Phase 4, descriptive slices
│   ├── components/
│   │   ├── Board.svelte           # Chessground wrapper
│   │   ├── Clock.svelte
│   │   ├── MoveList.svelte
│   │   ├── AccountPicker.svelte
│   │   ├── QuickSetup.svelte
│   │   ├── GameBar.svelte         # Resign / draw / abort
│   │   └── PromotionDialog.svelte
│   ├── App.svelte                 # Home (quick setup + history)
│   ├── Play.svelte                # /play/ in-progress game
│   ├── History.svelte             # /history/ game archive
│   ├── Stats.svelte               # /stats/ (Phase 4)
│   ├── Settings.svelte            # /settings/ accounts + prefs
│   ├── main.ts / play.ts / history.ts / stats.ts / settings.ts
│   └── app.css
├── static/                        # Vite publicDir — manifest.json, sw.js, icons
├── index.html, play/, history/, stats/, settings/ (multi-page entries)
├── vite.config.ts
├── vitest.config.ts
├── svelte.config.js
├── tsconfig.json
├── package.json
└── docs/
    ├── plan.md                    # This file
    └── (other docs as needed)
```

---

## Phases

Built incrementally. Do not start a phase before the previous one is
complete and stable. Each phase ends with a release tag.

### Phase 0 — Scaffold ✓ Complete

**Goal:** Empty but correct foundation. No game logic yet.

- Vite + Svelte + strict TS + Vitest set up, mirroring tayrax.
- PWA manifest (full-featured: name, icons, `display: standalone`,
  theme colors, start URL) + a hand-written `sw.js` in `static/` (no
  Workbox, no PWA plugin). **Network-first with stale fallback:** on
  `fetch`, try network first, update cache on success, fall back to
  cache on failure. Cache name includes `__APP_VERSION__` from Vite's
  `define`; on `activate`, purge non-matching caches. SW registered
  only in production (`import.meta.env.PROD`), never in dev. A
  `/devtools/unregister-sw.html` helper page (or equivalent Settings
  action) is added early to clear stale caches during development.
  Aggressive precaching (full offline-first OTB, Workbox-managed
  shell) is deliberately deferred to Phase 4+ when the feature set
  has stabilized — see "Phase 5+ — Future" notes.
- Multi-page Vite config with entries for `/`, `/play/`, `/history/`,
  `/settings/`.
- Dark color scheme via CSS custom properties in `app.css`.
- `Account` data model + `accounts.ts` store (IndexedDB-backed) with
  CRUD. Account picker UI shell.
- One placeholder OTB account ("Guest") auto-created on first load.
- GitHub Actions: `check.yml` (svelte-check + tests + build) and
  `deploy.yml` (tag-driven Pages deploy).
- Copyright headers wired in.

**Done when:** app loads, renders an empty home page with an account
picker listing "Guest", no console errors, all tests pass, `npm run
build` produces a working PWA that installs.

**Completed:** 2026-04-16. Scaffold is up: Vite + Svelte + strict TS + Vitest, PWA manifest + hand-written sw.ts, multi-page config (/, /play/, /history/, /settings/), dark CSS custom properties, Account data model + accounts.ts + AccountPicker.svelte, Guest auto-creation, copyright headers, CI workflows.

### Phase 1 — Over-the-Board Play ✓ Complete

**Goal:** A fully playable local chess app. No network, no lichess.

- `Board.svelte` wrapping chessground (mount on `onMount`, tear down
  on `onDestroy`, props: FEN, orientation, legal moves, on-move
  callback).
- `engine.ts` wrapping chess.js (move validation, FEN, game status,
  PGN out).
- `Clock.svelte` + `clock.ts` (rapid, blitz, bullet, classical,
  correspondence, increment).
- `game-state.ts` IndexedDB persistence — survives reload.
- `PromotionDialog.svelte` — the one unavoidable modal.
- `MoveList.svelte` with click-to-navigate history.
- `GameBar.svelte` — resign, offer draw, abort, reset.
- Home page: `QuickSetup.svelte` with common time controls + account
  picker (both colors). Start button goes to `/play/`.
- Game-over banner, not modal.
- On finish: PGN is serialized and saved to the `Game` store via
  `games.ts`, tagged with `source: 'otb'` and both account IDs.
- Add more OTB accounts via `/settings/`.

**Done when:** a full game can be played start to finish, survives
reload, and appears in the (still-simple) history page afterward.
Layout works on phone portrait and laptop landscape without visual
regressions.

**Completed:** 2026-04-16. chess.js + chessground installed; Engine, Clock, Board.svelte, Clock.svelte, MoveList.svelte, PromotionDialog.svelte, GameBar.svelte, QuickSetup.svelte implemented; games.ts + game-state.ts + clock.ts + color.ts + time-control.ts in lib/; Play.svelte responsive grid layout; App.svelte QuickSetup home; History.svelte game list; Settings.svelte OTB account management. vendor.sh pulls cburnett SVGs; chessground CSS imported from npm. 62/62 tests, 0 type errors.

### Phase 2 — Lichess

**Goal:** Play on lichess, multiple accounts supported.

- `lichess/auth.ts` — OAuth PKCE, token per account. Uses lichess's
  **public OAuth client mode**: `client_id` is a self-chosen string
  (`chesslovaquia`, unchanged from the current implementation), no app
  registration is required anywhere, and `redirect_uri` is computed
  dynamically as `window.location.origin + window.location.pathname`
  — works in dev (`localhost:5173`), preview (`localhost:4173`), and
  production without configuration. PKCE (`crypto.getRandomValues` +
  `crypto.subtle.digest('SHA-256', ...)`) handles the security side
  entirely client-side. Scope stays minimal (`board:play`; add
  `challenge:read challenge:write` only if/when needed). The logic in
  current `ts/lichess/LichessAuth.ts` is a good reference for the
  PKCE/callback mechanics — port verbatim to Svelte, don't redesign.
  **Multi-account storage:** token + user info live in the `Account`
  record (IndexedDB), not in singleton localStorage keys. The
  transient PKCE code verifier stays in localStorage but keyed by an
  in-flight auth ID (`clvq.lichess.pending.<id>`) so the callback
  knows which pending account to complete. "Add lichess account"
  kicks off a new PKCE flow each time; adding a second account
  requires logging out on lichess.org or using an incognito tab
  (lichess-side UX constraint). On account removal, best-effort
  `DELETE https://lichess.org/api/token` with the bearer; failure is
  non-fatal (local record is gone, user can revoke at lichess.org if
  they care). No paste-token fallback.
- `lichess/client.ts` — HTTP client, bearer token injected per call
  based on active account, 429 handling with backoff.
- `lichess/stream.ts` — NDJSON stream reader with exponential-backoff
  reconnect (capped at 30s, reconnect counter reset only after ≥10s
  of stable connection — same guardrail tayrax uses for its
  WebSockets).
- `lichess/play.ts` — seek (incl. correspondence), challenge, live
  game streaming, resign, draw, takeback, move send.
- Reconnect: active lichess game ID + account ID persisted in
  localStorage. On reload of `/play/`, if found and that account is
  still logged in, rejoin the game; otherwise clear and fall back.
- `lichess/history.ts` — import finished games from
  `/api/games/user/{username}` per-account. Games land in `games.ts`
  with `source: 'lichess'`.
- Home quick-setup gains a "play on lichess" toggle; the account
  picker filters to lichess accounts when on.
- Challenge flow UI: pick opponent (friend username or random).

**Done when:** a user can add two lichess accounts, play a game as
either one, reconnect after a reload, and see both accounts' full
imported history in one combined list.

### Phase 3 — Chess.com (Import Only)

**Goal:** Pull your chess.com games into the same consolidated
history. No live play.

- `chesscom/client.ts` — public archives API (read-only, no auth,
  just username).
- `chesscom/import.ts` — walk `/pub/player/{username}/games/archives`,
  fetch each month, parse PGN, ingest into `games.ts` with `source:
  'chesscom'`. Idempotent: re-import skips games already present by
  `sourceGameId`.
- Add chess.com "accounts" in `/settings/` (just a username — no
  auth).
- Multi-username support — several chess.com handles under one local
  user.
- `/history/` now shows games from all three sources in one view,
  filterable by account and network.

**Done when:** importing your chess.com archive produces a unified
history with OTB + lichess + chess.com games, filterable and sortable.
Scope note: live play on chess.com is out — their public API does not
support it, and the Partner API is not self-serve. If that ever
changes, it'd be a future phase.

### Phase 4 — Consolidated Stats

**Goal:** Descriptive stats across all networks. No custom ratings
yet.

- `stats.ts` — pure functions over the `games.ts` store:
  - W/L/D overall and per time-control bucket.
  - W/L/D by color.
  - W/L/D by account, by network.
  - Opening frequency (by ECO code and name), with result splits.
  - Time-of-day / day-of-week patterns.
  - Trend over rolling windows (last 10, 50, 100 games).
- `Stats.svelte` page — tables and simple SVG charts (same approach
  tayrax's `Chart.svelte` uses; no charting library).
- Filter by any combination of account / network / time bucket / date
  range.

**Done when:** all the above slices render correctly and the page
stays responsive with a few thousand games in the store.

### Phase 5+ — Future (Not Planned In Detail)

Ideas worth holding but not committing to:

- **Local analysis** with Stockfish WASM in a web worker. Auto-analyze
  imported games, surface blunder rate trends across networks. This is
  the strongest differentiator still on the table.
- **Custom metrics** derived from analysis (not ratings, but things
  like "accuracy trend," "avg. centipawn loss per time bucket").
- **Own rating system** — only attempt after several months of real
  usage and a clear understanding of what the descriptive stats are
  *not* telling you. Any rating formula designed up-front will be
  wrong.
- **PGN import** from arbitrary sources (clipboard paste, file
  upload).
- **Aggressive PWA precaching** via `vite-plugin-pwa` / Workbox:
  precache app shell + chess.js + chessground + board assets + one
  piece set so offline OTB works from first install, not first online
  load. Runtime-cache lichess API responses with short TTLs
  (stale-while-revalidate). `skipWaiting` + `clientsClaim` gated
  behind a user-visible "update available" banner. Worth doing once
  feature churn slows; not worth fighting cache-invalidation
  complexity before then.
- **Custom "chesslovaquia dark" board theme** — a new board CSS file
  added to the theme dropdown, designed against the app's real look
  once it's in hand. Requires actual visual design work (square
  colors, piece-highlight contrast, legal-move dot colors), so
  deferred until there's something to design against.

These stay out of scope until the first four phases are stable.

---

## Conventions

- Every source file starts with the copyright header, followed by a
  blank line:
  - `.ts`: `// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>`
    `// See LICENSE file.`
  - `.svelte`: `<!-- Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com> -->`
    `<!-- See LICENSE file. -->`
- TypeScript strict mode. No `any`, no implicit types.
- Named exports in `.ts` files. No default exports.
- Business logic (engine wrappers, clocks, network clients, stats)
  lives in `src/lib/` — never inside components.
- One responsibility per file. Don't mix network code with stats
  math.
- Color conversion between chess.js (`'w'/'b'`) and chessground
  (`'white'/'black'`) goes through a single helper module. Inline
  ternaries for this conversion are disallowed — same rule as current
  clvq, it pays off.
- Storage keys are versioned (`clvq.games.v1`, etc.). Bump on schema
  change.
- All logging goes through a single `logger` singleton. `logger.debug`
  gated on `localStorage.setItem('clvq.debug', '1')`. Never call
  `console.*` directly.

---

## What Gets Reused From Current clvq

Ideas and patterns worth carrying forward (as references, not code):

- Class-per-concern split with a `GameDeps`-style DI object for
  testability.
- Strict `ClvqError` / `GameError` / `EngineError` / `ConfigError` /
  `LichessError` hierarchy.
- Early DOM validation at init (adapted to Svelte: validated at the
  store level instead).
- Color conversion discipline via a `ColorUtils`-equivalent.
- Lichess OAuth PKCE flow shape.
- Lichess NDJSON event routing with type guards (no `as unknown as`
  casts).
- `readNdjson<T>` helper with `onError: 'throw' | 'skip'` semantics.
- IndexedDB generic store pattern (`ClvqIndexedDB<T>` equivalent).
- Active-game persistence key for reconnect on reload — extended to
  include the account ID.

No code is copy-pasted. Each of the above is reimplemented to fit the
Svelte + Vite + store-centric architecture cleanly.

---

## What Does Not Get Reused

- Hugo and its asset pipeline (wrong tool for a stateful UI).
- The layout system built on Hugo partials + theme (`clvq1`).
- The current class-heavy `ChessGame` orchestrator (DI is good, the
  specific shape isn't worth preserving through a framework change).
- Any CSS from the current theme.
- Any direct-DOM-manipulation code in `ts/game/` — Svelte replaces
  all of it.

---

## Decisions Log

Questions raised during planning and the resolutions that went into
this document. Kept for traceability — if any of these get
reconsidered later, update the relevant section and add a new entry
here with the new date.

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Rewrite in place or new repo? | In place, on whatever branch the user has checked out (currently `v1/main`). Branch transitions are the user's call, not something the agent plans around. | Keep history, URL, Pages config, stars, issues. "Delete everything" step is trivial; losing context isn't. |
| 2 | Default board theme | Lichess-style (brown + cburnett) with theming machinery in place from day one | Known-good baseline means the board is never the variable when iterating on layout. Custom theme is a design problem, not a code problem — defer until the app is in hand. |
| 3 | Lichess account creation UX | OAuth PKCE in public-client mode, no paste-token fallback, port from current `LichessAuth.ts` | Already works in production — `client_id` is a self-chosen string, `redirect_uri` is dynamic, no registration required. Multi-account just needs per-account storage instead of singleton keys. |
| 4 | Service worker scope | Minimal hand-written `sw.js` with network-first + stale fallback; aggressive precaching deferred to Phase 4+ | Aggressive precache is a cache-invalidation foot-gun during active development. PWA install badge and offline-shell fallback are met with the minimal version. Upgrade when feature churn slows. |

No open questions remain blocking Phase 0.
