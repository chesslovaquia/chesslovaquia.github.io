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

### 6. Fix ClvqIndexedDB Failed Promise Caching

**Problem:** `getDB()` caches the promise from `indexedDB.open()`. If it rejects, the
same failed promise is returned on every subsequent call — the database is permanently
broken for the session.

**Files:** `ts/clvq/ClvqIndexedDB.ts` (lines 24-42)

**Action:**
- Clear the cached promise on rejection
- Or implement lazy retry with backoff

---

### 7. Consolidate Color Conversion

**Problem:** `EngineColor` ('w'/'b') to `BoardColor` ('white'/'black') conversion is
duplicated in `GameMove.ts`, `GamePromotion.ts`, `GameDisplay.ts`, and others.
`Record<EngineColor, T>` appears ~12 times with no shared type alias.

**Files:** `ts/engine/ChessjsEngine.ts`, `ts/game/GameMove.ts`, `ts/game/GameDisplay.ts`,
`ts/game/ChessGame.ts`, `ts/board/ChessgroundBoard.ts`

**Action:**
- Create `ts/engine/ColorUtils.ts` with `toBoard()` and `toEngine()` helpers
- Create shared `BySide<T> = Record<EngineColor, T>` type alias
- Replace all inline conversions and repeated Record types

---

### 8. Make ChessjsEngine.setState() Transactional

**Problem:** If move N in a replay is invalid, moves 1..N-1 are already applied. The
method resets then throws, but the caller can't recover to the pre-call state.

**Files:** `ts/engine/ChessjsEngine.ts`

**Action:**
- Snapshot FEN before replaying
- On error, restore the snapshot before throwing
- Add test for partial-replay recovery

---

### 9. Reduce Test Infrastructure Duplication

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

---

## Priority: Low

### 10. Remove Unnecessary Async in GameCaptures

**Problem:** `updateMaterial()` and `updateCount()` are marked `async` but only do
DOM manipulation. `GameNavigate` then `await`s them in a loop, adding latency for
no reason.

**Files:** `ts/game/GameCaptures.ts`, `ts/game/GameNavigate.ts`

**Action:**
- Drop `async` keyword from both methods
- Remove corresponding `await` calls in `GameNavigate`

---

### 11. Add Explicit Promotion Modal ElementIds

**Problem:** `GamePromotion.ts` builds modal IDs via template literal
`` `${side}${ElementIds.pawnPromotion}` `` — violates the project convention of
using `ElementIds.*` constants and defeats static analysis.

**Files:** `ts/game/GamePromotion.ts`, `ts/clvq/ElementIds.ts`

**Action:**
- Add `promotionWhite` and `promotionBlack` to `ElementIds`
- Replace template literal concatenation

---

### 12. DRY Config Validation

**Problem:** `ConfigGameUI.validate()` and `ConfigGamePlayer.validate()` repeat the
same if-null-throw pattern 13 times.

**Files:** `ts/config/ConfigGameUI.ts`, `ts/config/ConfigGamePlayer.ts`

**Action:**
- Extract `requireElement(el: HTMLElement | null, name: string): HTMLElement` helper
- Replace all 13 checks with single-line calls

---

### 13. Add Logging Abstraction

**Problem:** 67 `console.debug` calls scattered across the codebase with no way to
filter by severity or disable in production.

**Files:** Throughout `ts/`

**Action:**
- Create minimal `Logger` interface with `debug()`, `warn()`, `error()`
- Inject via constructors (or use a singleton with a level flag)
- Replace raw `console.debug` calls

---

### 14. Handle Fire-and-Forget Promise Rejections

**Problem:** Several places silently discard promise rejections:
- `GameCaptures.ts:197` — `.then(() => { return; })` with no `.catch()`
- `GameSetup.ts:44` — `removeItem()` not awaited
- `GameState.ts:128` — `save()` fire-and-forget during setup

**Files:** `ts/game/GameCaptures.ts`, `ts/game/GameSetup.ts`, `ts/game/GameState.ts`

**Action:**
- Add `.catch(err => console.error(...))` to all fire-and-forget promises
- Or await them if the caller can handle the error

---

## Not Refactoring (Things That Are Fine)

- **Overall architecture** — event-driven, interface-based DI, early config validation
- **GameDisplay** — well-isolated, read-only rendering
- **Custom event pattern** — static `Name`/`Target` on event classes
- **Hugo asset pipeline** — correct, don't replace with raw `tsc`
- **Desktop/mobile layout split** — appropriate for the responsive strategy
