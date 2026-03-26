# Refactoring Action Plan

Full codebase review completed 2026-03-25. Items ordered by impact, highest first.
Each item includes the problem, where it lives, and what to do about it.

---

## Priority: High

### 1. Type-Safe Lichess Event Routing ✓ Done

**Problem:** `LichessGame.ts` uses double-cast `as unknown as Type` to route stream
events. The root `StreamEvent` type is `{ type: string; [key: string]: unknown }` —
no compile-time safety if the lichess API shape changes.

**Files:** `ts/lichess/LichessGame.ts`, `ts/lichess/LichessStream.ts`

**Action:**
- Replace `StreamEvent` with a discriminated union over all known event types
- Add type guard functions for each variant
- Remove all `as unknown as` casts from event routing

**Implemented:** Added five `StreamEvent &` intersection types (`ChallengeStreamEvent`,
`GameStartStreamEvent`, `GameFinishStreamEvent`, `GameFullStreamEvent`,
`GameStateStreamEvent`) and corresponding type guard functions in `LichessGame.ts`.
All five `as unknown as` casts removed. `LichessStream.ts` unchanged — its index
signature is load-bearing for test call sites that spread typed objects into
`StreamEvent`.

---

### 2. Extract Shared NDJSON Parser ✓ Done

**Problem:** `LichessStream.readNdjson()` and `LichessHistory.readNdjson()` duplicate
the same decode-split-trim-parse logic. They also differ in error handling (throw vs
warn-and-skip), making behavior inconsistent.

**Files:** `ts/lichess/LichessStream.ts`, `ts/lichess/LichessHistory.ts`

**Action:**
- Create `ts/lichess/NdjsonReader.ts` with a shared parse function
- Accept an error strategy parameter (`'throw' | 'skip'`)
- Replace both inline implementations

**Implemented:** Created `ts/lichess/NdjsonReader.ts` with `readNdjson<T>(stream, onLine, options?)`.
`LichessStream` calls it with `{ signal, onError: 'throw' }`; `LichessHistory` calls it with
`{ onError: 'skip' }` and collects results via a push callback.

---

### 3. Inject Hidden Dependencies (Fix Broken DI) ✓ Done

**Problem:** The project uses dependency injection via `GameDeps` for `ChessGame`, but
several modules create their own dependencies internally, breaking the pattern:
- `GameNavigate` creates `GameCaptures` in its constructor
- `GameState` creates `GameSetup` and `GameHistory` internally

**Files:** `ts/game/GameNavigate.ts`, `ts/game/GameState.ts`, `ts/game/GameDeps.ts`

**Action:**
- Add `GameCaptures` to `GameDeps` and inject into `GameNavigate`
- Add `GameSetup` and `GameHistory` to `GameDeps` and inject into `GameState`
- Update `mockGameDeps()` in `ts/testing/testing.ts`

**Implemented:** `GameCaptures`, `GameSetup`, and `GameHistory` added as fields on `GameDeps`.
`newGameDeps()` creates all three and passes them to their respective constructors.
`GameNavigate` constructor now accepts `captures: GameCaptures` as a fourth parameter;
`GameStateImpl` constructor now accepts `setup: GameSetup` and `history: GameHistory`.
`mockGameDeps()` required no changes — it delegates to `newGameDeps()` and inherits the
new wiring automatically. Also fixed three pre-existing test issues uncovered during this work:
`ChessGame.destroy()` now calls `clock.stop()` to clear intervals; `ChessGame_test.ts` uses
`vi.useFakeTimers()` + `game.destroy()` in beforeEach/afterEach to prevent timer leaks;
`ui_test.ts` no longer replaces `global.document` (which was corrupting event routing in
co-tenant test files via the shared vmThreads worker). Also fixed pre-existing TypeScript
errors: `GameCaptures.ts` `.at()` calls replaced with ES2019-compatible indexing;
`ui_test.ts` adds `/// <reference types="node" />` for the `fs` import.

---

### 4. Split Clvq.ts Into Focused Classes ✓ Done

**Problem:** `Clvq.ts` (299 lines) is a grab-bag: game setup, lichess auth lifecycle,
history management, UI callbacks, PGN export, modal toggling. Hard to test any piece
in isolation.

**Files:** `ts/clvq/Clvq.ts`

**Action:**
- Extract lichess UI callbacks (lines 214-254) into `LichessUIBridge`
- Extract history rendering and PGN export into `HistoryManager`
- Keep `Clvq` as a thin orchestrator that wires the pieces together

**Implemented:** Created `ts/lichess/LichessUIBridge.ts` — owns `onChallenge`,
`onGameStart`, `onGameFinish`, `onGameFull` callback registration and DOM updates,
`updateUI()` (auth state display), `acceptChallenge/declineChallenge/resign/abort/offerDraw`
action methods, and `pendingChallengeId`/`activeGameId` state as readonly getters.
Created `ts/clvq/HistoryManager.ts` — owns `historyRecords`, `load()`,
`loadFromLichess(auth)`, `exportPgn(index)`, and `renderHistoryList()`.
`Clvq.ts` reduced from 299 to ~130 lines; guards reading `bridge.pendingChallengeId`
and `bridge.activeGameId` stay in `Clvq` to preserve lazy `getLichessGame()` init.
Added `ts/testing/lichess/LichessUIBridge_test.ts` (20 tests) and
`ts/testing/clvq/HistoryManager_test.ts` (9 tests). Also fixed `screen_test.ts` and
`game_test.ts` which used bare `window.location.pathname = '...'` assignment — a
silent no-op on happy-dom's real Location object, exposed by the change in vmThreads
worker assignment when new test files were added. Both now use `vi.stubGlobal`.

---

### 5. Fix XSS in History Rendering ✓ Done

**Problem:** `Clvq.renderHistoryList()` builds HTML via string concatenation with
inline `onclick=` handlers and unescaped player names. If player names contain
malicious content, it executes.

**Files:** `ts/clvq/Clvq.ts` (lines 189-198)

**Action:**
- Replace string concatenation with `document.createElement()` + `addEventListener()`
- Remove all inline event handlers from generated HTML

**Implemented:** `HistoryManager.renderHistoryList()` rewritten to use
`listEl.replaceChildren()` + `createElement`/`textContent` for every element.
All user-controlled fields (`r.white`, `r.black`, `r.result`, `r.timeControl`)
are now set via `.textContent`, which escapes HTML automatically. The inline
`onclick="Clvq.exportPgn(${i})"` attribute was replaced with
`pgnBtn.addEventListener('click', () => this.exportPgn(i))`. Added one new test
in `HistoryManager_test.ts` verifying that player names containing `<script>` and
`<img onerror=...>` are not injected as raw HTML.

---

## Priority: Medium

### 6. Fix ClvqIndexedDB Failed Promise Caching ✓ Done

**Problem:** `getDB()` caches the promise from `indexedDB.open()`. If it rejects, the
same failed promise is returned on every subsequent call — the database is permanently
broken for the session.

**Files:** `ts/clvq/ClvqIndexedDB.ts` (lines 24-42)

**Action:**
- Clear the cached promise on rejection
- Or implement lazy retry with backoff

**Implemented:** Added `this.promise = null;` in `req.onerror` before calling `reject()`.
Concurrent awaiters that already hold a reference to the rejected promise still receive
the rejection correctly; only new callers after the failure get a fresh open attempt.
Added a `'failure recovery'` test in `ts/testing/clvq/db_test.ts` that mocks
`indexedDB.open` to fail, verifies rejection, then confirms the next call retries
successfully.

---

### 7. Consolidate Color Conversion ✓ Done

**Problem:** `EngineColor` ('w'/'b') to `BoardColor` ('white'/'black') conversion is
duplicated in `GameMove.ts`, `GamePromotion.ts`, `GameDisplay.ts`, and others.
`Record<EngineColor, T>` appears ~12 times with no shared type alias.

**Files:** `ts/engine/ChessjsEngine.ts`, `ts/game/GameMove.ts`, `ts/game/GameDisplay.ts`,
`ts/game/ChessGame.ts`, `ts/board/ChessgroundBoard.ts`

**Action:**
- Create `ts/engine/ColorUtils.ts` with `toBoard()` and `toEngine()` helpers
- Create shared `BySide<T> = Record<EngineColor, T>` type alias
- Replace all inline conversions and repeated Record types

**Implemented:** Created `ts/engine/ColorUtils.ts` exporting `toBoard(EngineColor):
BoardColor`, `toEngine(BoardColor): EngineColor`, and `BySide<T> = Record<EngineColor, T>`.
Replaced inline ternary/if-else conversions in `ChessjsEngine.ts` (`turnColor()`),
`GameMove.ts` (`turnColor()`), `ChessgroundBoard.ts` (`turnColor()`),
`GamePromotion.ts` (`finish()` inverse conversion), and `LichessGameState.ts`
(`getPlayerColor()`). Replaced all `Record<EngineColor, T>` field and type declarations
with `BySide<T>` in `GameClock.ts` (3 fields + `ClockState` type) and `GameCaptures.ts`
(4 fields + `CapturesState` type). `GameDisplay.ts` winner-label inversions left as-is
(logically inverted: 'w' turn → 'Black' wins — not a color conversion).

---

### 8. Make ChessjsEngine.setState() Transactional ✓ Done

**Problem:** If move N in a replay is invalid, moves 1..N-1 are already applied. The
method resets then throws, but the caller can't recover to the pre-call state.

**Files:** `ts/engine/ChessjsEngine.ts`

**Action:**
- Snapshot FEN before replaying
- On error, restore the snapshot before throwing
- Add test for partial-replay recovery

**Implemented:** `setState()` now captures `this.game.fen()` into `snapshotFen` before
calling `reset()`. On any invalid move, `this.game.load(snapshotFen)` restores the
pre-call board position before throwing `EngineError`. Also fixed a latent bug: chess.js
1.x throws `Error` for invalid moves rather than returning null, so the existing
`if (move)` guard was dead code — the replay loop now wraps `this.game.move(san)` in a
try-catch to catch both thrown errors and null returns, converting them to `EngineError`.
Added `describe('ChessjsEngine.setState')` in `ts/testing/engine/ChessjsEngine_test.ts`
with three tests: valid moves applied, error thrown on invalid move, and position restored
after partial-replay failure.

---

### 9. Reduce Test Infrastructure Duplication ✓ Done

**Problem:**
- `document.body.innerHTML = mockConfigGameUI()` in 11 test `beforeEach` blocks
- Mock factories (`mockAuth()`, `mockClient()`, `mockLichessGame()`) defined locally in
  `LichessUIBridge_test.ts`, `Clvq_test.ts`, `LichessGameState_test.ts`
- Missing dedicated tests for `GameMove`, `GameBoard`, `NdjsonReader`, events

**Files:** `ts/testing/testing.ts`, `ts/testing/*_test.ts`

**Action:**
- Add `setupGameTestDOM()` helper to `testing.ts`
- Centralize `mockLichessAuth()`, `mockLichessClient()`, `mockLichessGame()` in `testing.ts`
- Add test files for missing units

**Implemented:** Added `setupGameTestDOM()` to `testing.ts` and updated 9 test files
(`ConfigGamePlayer`, `ConfigGameUI`, `ChessGame`, `GameCaptures`, `GameClock`,
`GameDisplay`, `GameNavigate`, `GamePromotion`, `game`) to use it instead of the raw
`document.body.innerHTML = mockConfigGameUI()` pattern. `GamePromotion_test.ts` appends
its extra promotion HTML via `+=` after `setupGameTestDOM()`. Added
`mockLichessAuth(loggedIn?)`, `mockLichessClient()`, `mockLichessGame()`,
`setupLichessTestDOM()`, and `LichessCallbacks` type to `testing.ts`; removed the
identical local definitions from `LichessUIBridge_test.ts` and `Clvq_test.ts`. Both
files now import the shared factories from `testing.ts`. Added three new test files:
`ts/testing/lichess/NdjsonReader_test.ts` (8 tests: happy path, chunked input, skip/throw
error strategies, pre-aborted signal, abort-after-first-line);
`ts/testing/game/GameMove_test.ts` (7 tests: exec valid/null/throw, undo true/false,
turnColor white/black); `ts/testing/events/events_test.ts` (16 tests: Name, Target,
detail, and dispatch for all four event classes). `ChessgroundBoard` skipped — it
wraps the Chessground canvas library and is covered indirectly via `ChessGame_test.ts`.

---

## Priority: Low

### 10. Remove Unnecessary Async in GameCaptures ✓ Done

**Problem:** `updateMaterial()` and `updateCount()` are marked `async` but only do
DOM manipulation. `GameNavigate` then `await`s them in a loop, adding latency for
no reason.

**Files:** `ts/game/GameCaptures.ts`, `ts/game/GameNavigate.ts`

**Action:**
- Drop `async` keyword from both methods
- Remove corresponding `await` calls in `GameNavigate`

**Implemented:** Removed `async`/`Promise<void>` from `updateMaterial()`, `updateCount()`,
`setSidePosition()` (and its internal `await`), and `setPosition()` — all four now return
`void`. `flip()` fire-and-forget `.then(() => { return; })` replaced with a direct call.
`GameNavigate` required no changes — its callers already omitted `await`. Updated
`GameCaptures_test.ts`: the `'setPosition awaits setSidePosition'` test was rewritten as a
sync assertion since `setPosition` no longer returns a Promise.

---

### 11. Add Explicit Promotion Modal ElementIds ✓ Done

**Problem:** `GamePromotion.ts` builds modal IDs via template literal
`` `${side}${ElementIds.pawnPromotion}` `` — violates the project convention of
using `ElementIds.*` constants and defeats static analysis.

**Files:** `ts/game/GamePromotion.ts`, `ts/clvq/ElementIds.ts`

**Action:**
- Add `promotionWhite` and `promotionBlack` to `ElementIds`
- Replace template literal concatenation

**Implemented:** Removed `pawnPromotion: 'PawnPromotion'` from `ElementIds` and replaced with
`promotionWhite: 'whitePawnPromotion'` and `promotionBlack: 'blackPawnPromotion'`. `GamePromotion.ts`
`showModal()` now resolves the modal ID via a ternary (`side === 'white' ? ElementIds.promotionWhite :
ElementIds.promotionBlack`) instead of string concatenation. `GamePromotion_test.ts` updated to use
the new constants throughout. HTML partial unchanged — it already generates the matching IDs
(`whitePawnPromotion`, `blackPawnPromotion`) via the `$side` template variable.

---

### 12. DRY Config Validation ✓ Done

**Problem:** `ConfigGameUI.validate()` and `ConfigGamePlayer.validate()` repeat the
same if-null-throw pattern 13 times.

**Files:** `ts/config/ConfigGameUI.ts`, `ts/config/ConfigGamePlayer.ts`

**Action:**
- Extract `requireElement(el: HTMLElement | null, name: string): HTMLElement` helper
- Replace all 13 checks with single-line calls

**Implemented:** Added `requireElement(el, name)` as a named export in `ts/config/ConfigError.ts`
(natural home — it throws `ConfigError`). `ConfigGameUI.validate()` now has 9 single-line
`requireElement` calls; `ConfigGamePlayer.validate()` has 4. Both classes no longer import
`ConfigError` directly. No test changes required — all 20 existing config tests pass unchanged.

---

### 13. Add Logging Abstraction ✓ Done

**Problem:** 68 `console.debug` calls scattered across the codebase with no way to
filter by severity or disable in production.

**Files:** Throughout `ts/`

**Action:**
- Create minimal `Logger` interface with `debug()`, `warn()`, `error()`
- Inject via constructors (or use a singleton with a level flag)
- Replace raw `console.debug` calls

**Implemented:** Created `ts/clvq/Logger.ts` with a `Logger` class (`debug()`, `warn()`,
`error()`) and an exported `logger` singleton. Debug output is suppressed unless
`localStorage.getItem('clvq.debug') === '1'`; `warn` and `error` always output.
Replaced all `console.debug`, `console.warn`, `console.error`, and `console.log` calls
across 22 production files (91 total calls, including 8 `console.log` calls in
`GamePromotion.ts` and `main.ts` that were previously untracked). Added
`ts/testing/clvq/Logger_test.ts` (7 tests: debug suppressed/enabled, multi-arg forwarding,
warn/error always output).

---

### 14. Handle Fire-and-Forget Promise Rejections ✓ Done

**Problem:** Several places silently discard promise rejections (9 locations across 5 files):
- `GameSetup.ts:44` — `removeItem()` not awaited
- `GameState.ts:68` — `removeItem()` not awaited
- `GameState.ts:69` — `removeGame()` not awaited
- `GameState.ts:128` — `save()` fire-and-forget during setup
- `GameState.ts:144` — `save()` fire-and-forget in `toggleOrientation()`
- `ChessGame.ts:187` — `state.save()` fire-and-forget in `saveState()`
- `ChessGame.ts:222` — `state.save()` fire-and-forget in `doOpponentMove()`
- `GamePromotion.ts:83` — `state.save()` fire-and-forget in `saveState()`
- `setup.ts:16` — `.then()` without `.catch()`

Note: the original `GameCaptures.ts:197` issue was fixed by item #10 (async removal).

**Files:** `ts/game/GameSetup.ts`, `ts/game/GameState.ts`, `ts/game/ChessGame.ts`,
`ts/game/GamePromotion.ts`, `ts/game/setup.ts`

**Action:**
- Add `.catch(err => console.error(...))` to all fire-and-forget promises
- Or await them if the caller can handle the error

**Implemented:** Where the caller is already `async`, replaced fire-and-forget with `await`:
`GameSetup.removeGame()` now `await`s `db.removeItem()` (rejection propagates to caller);
`GameState.setupNewGame()` now `await`s `this.save()`. Where the caller is sync and cannot
be awaited, chained `.catch((err: unknown) => logger.error('...', err))`:
`GameState.reset()` adds `.catch()` to both `db.removeItem()` (`'State reset error:'`) and
`setup.removeGame()` (`'State setup remove error:'`); `GameState.toggleOrientation()`,
`ChessGame.saveState()`, `ChessGame.doOpponentMove()`, and `GamePromotion.saveState()`
all add `.catch((err: unknown) => logger.error('State save error:', err))` to `state.save()`
calls (defensive — `save()` has internal try/catch and never rejects, but the `.catch()`
is present for correctness). `setup.ts` chains `.catch((err: unknown) =>
clvqInternalError(err as Error))` on the `getGame().then()` call — `clvqInternalError` was
already imported and used in the surrounding catch block. Added
`ts/testing/game/GameSetup_test.ts` (2 tests: resolves and clears data, rejects when
`removeItem` rejects) and `ts/testing/game/GameState_test.ts` (2 tests: `reset()` logs
`'State reset error:'` when `removeItem` rejects, logs `'State setup remove error:'` when
`removeGame` rejects).

---

### 15. ClvqIndexedDB Generic Types ✓ Done

**Problem:** 6 `any` types in `ClvqIndexedDB` — the only real type safety gap in the codebase.
`getItem` returned `Promise<any>`, `setItem` took `val: any`, `getAll` returned `Promise<any[]>`.

**Files:** `ts/clvq/ClvqIndexedDB.ts`, `ts/game/GameState.ts`, `ts/game/GameSetup.ts`,
`ts/game/GameHistory.ts`, `ts/testing/clvq/db_test.ts`, `ts/testing/game/GameHistory_test.ts`

**Action:**
- Add type parameter `T` to `ClvqIndexedDB<T>`
- Type-safe signatures: `getItem → Promise<T | null>`, `setItem(val: T)`, `getAll → Promise<T[]>`
- Update construction sites with concrete types

**Implemented:** `ClvqIndexedDB<T>` generic class. `getItem` returns `Promise<T | null>`,
`setItem` takes `val: T`, `getAll` returns `Promise<T[]>`. Internal `getAll` cast changed
from `(req.result as any[]).map((r: any) => r.value)` to typed
`(req.result as Array<{ key: string; value: T }>).map((r) => r.value)`. Updated construction
sites: `GameStateImpl` uses `ClvqIndexedDB<StateData>`, `GameSetup` uses
`ClvqIndexedDB<SetupData>`, `GameHistory` uses `ClvqIndexedDB<HistoryRecord>`. Removed
downstream `as HistoryRecord[]` cast in `GameHistory.list()`. `GameSetup.getGame()` uses
`?? undefined` to convert `null` return to `undefined` (matching the field type). Test
instances use `ClvqIndexedDB<unknown>` since they exercise DB mechanics, not type safety.

---

### 16. GameClock.update() Unnecessary `async` ✓ Done

**Problem:** `private async update(turn: EngineColor): Promise<void>` contains no `await` —
only DOM manipulation. Same issue fixed for GameCaptures in item #10.

**File:** `ts/game/GameClock.ts`

**Action:** Remove `async` keyword, change return type to `void`.

**Implemented:** Removed `async` and `Promise<void>` from `update()` — now returns `void`.
All 6 callers already ignore the return value; no changes needed elsewhere.

---

### 17. ChessGame Missing `.catch()` ✓ Done

**Problem:** Two promise chains in `ChessGame` had no error handling, inconsistent with the
9 locations fixed in item #14.

**File:** `ts/game/ChessGame.ts`

**Action:** Add `.catch()` to both `.then()` chains.

**Implemented:** Added `.catch((err: unknown) => logger.error('Game load error:', err))` to
`state.load().then(...)` in `init()`, and `.catch((err: unknown) => logger.error('Game setup
error:', err))` to `state.setupNewGame().then(...)` in `setup()`.

---

### 18. `(window as any)` Global Exposure ✓ Done

**Problem:** `main.ts` and `devel.ts` used `(window as any)` to attach globals, bypassing
type checking.

**Files:** `ts/clvq/main.ts`, `ts/clvq/devel.ts`

**Action:** Add `declare global { interface Window { ... } }` augmentation, remove `as any`.

**Implemented:** Added `declare global { interface Window { Clvq: Clvq } }` in `main.ts` and
`declare global { interface Window { ClvqDevel: ClvqDevel } }` in `devel.ts`. Replaced
`(window as any).Clvq` with `window.Clvq` and `(window as any).ClvqDevel` with
`window.ClvqDevel`.

---

## Not Refactoring (Things That Are Fine)

- **Overall architecture** — event-driven, interface-based DI, early config validation
- **GameDisplay** — well-isolated, read-only rendering
- **Custom event pattern** — static `Name`/`Target` on event classes
- **Hugo asset pipeline** — correct, don't replace with raw `tsc`
- **Desktop/mobile layout split** — being replaced by a single responsive layout (see `docs/ui-refactor.md`)
- **Error class hierarchy** — `GameError`/`EngineError`/`ConfigError` extend `Error` directly while `LichessError` extends `ClvqError`. No code uses `instanceof ClvqError` to catch all app errors, so unifying has zero practical benefit.
- **ChessGame orchestrator size** — 311 lines with focused methods, doing its job as an orchestrator
- **GameClock size** — 321 lines for a single-purpose clock class with short methods
- **DOMHelper / EventManager abstractions** — premature; each pattern appears in few places
- **Import style** (`import * as utils` vs named imports) — style preference, not a defect
- **GameCaptures / HistoryManager splitting** — both well-focused at ~200 and ~100 lines
