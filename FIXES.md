# Chesslovaquia — Code Review & Fixes

Issues found during code review, organized by priority.

---

## Critical — Async/Promise Correctness

**1. `GameState.save()` has no error handling**
`ts/game/GameState.ts` — `.then()` with no `.catch()`. Failed DB writes are silently swallowed; game state can be lost without the user knowing.

**2. Missing `await` on async calls in `GameState.load()`**
`setSetupData()` is called without `await`, creating a race condition — setup data may not be ready when the game tries to use it.

**3. `save()` is declared `void` but does async work**
Callers can't know when persistence is complete. Any logic that assumes state is saved after `save()` returns is wrong.

**4. Same pattern in `GameCaptures`**
`ts/game/GameCaptures.ts` — `setSidePosition()` is async but called without `await`, so material display may render out of order.

---

## High — Event Listener Leaks

**5. Promotion modal accumulates click listeners**
`ts/game/GamePromotion.ts` — `addEventListener` called inside `showModal()` with no `removeEventListener`. After multiple promotions in one game, each click fires the handler N times.

**6. Game-level event listeners never removed**
`ts/game/ChessGame.ts` — `EventBoardMove` and clock timeout listeners are registered in the constructor and never cleaned up. Reinitializing a game stacks listeners.

---

## High — Logic and State

**7. Potential negative index in navigation**
`ts/game/GameNavigate.ts` — `navBackward()` decrements `this.index` without checking if it's already at 0. Array access with `-1` returns `undefined` but no guard exists.

**8. Dead code in `GameClock`**
`ts/game/GameClock.ts` — `const turn = this.engine.turn()` is assigned but never used inside the `firstMove` branch. Suggests an incomplete feature.

**9. No promotion piece validation**
`ts/game/GamePromotion.ts` — `elem.dataset.piece` is passed directly to the engine callback without checking it's a valid piece type. A malformed DOM could pass bad data to chess.js.

---

## Medium — Type Safety

**10. `any` in error class constructors**
`ts/config/ConfigError.ts`, `ts/game/GameError.ts`, `ts/engine/EngineError.ts` — constructor parameter `msg` has no type annotation (implicitly `any`). Should be `string`.

**11. `any` used in `ClvqIndexedDB`**
`ts/clvq/ClvqIndexedDB.ts` — `event as any` bypasses type checking for IDB event properties. Proper IDB event types exist.

**12. Callback typed as `any` in `GamePromotion`**
`ts/game/GamePromotion.ts` — `showModal(side, callback: any)` — the callback signature should be typed explicitly.

---

## Medium — Testing Gaps

**13. DB tests have no assertions**
`ts/testing/clvq/db_test.ts` — tests call `db.setItem()` etc. but contain no `expect()` statements. They pass trivially and catch nothing.

**14. No tests for clock, captures, navigation, or promotion**
These subsystems have zero test coverage. Clock timeout logic, navigation bounds, and promotion piece selection are all untested.

---

## Low — Code Quality

**15. `console.log` mixed with `console.debug`**
`ts/game/GameMove.ts` — production logs are polluted with move state. Should be uniformly `console.debug`.

**16. Magic string element IDs scattered across files**
`'gameDescription'`, `'current'`, `'setup'` etc. are repeated as raw strings. A typo silently returns `null` and fails at runtime instead of compile time.

---

## Summary Table

| # | Priority | Area | File(s) |
|---|---|---|---|
| 1 | Critical | No `.catch()` on DB write | `ts/game/GameState.ts` |
| 2 | Critical | Missing `await` in `load()` | `ts/game/GameState.ts` |
| 3 | Critical | `save()` void but async | `ts/game/GameState.ts` |
| 4 | Critical | Missing `await` in captures | `ts/game/GameCaptures.ts` |
| 5 | High | Event listener leak in promotion | `ts/game/GamePromotion.ts` |
| 6 | High | Event listeners never removed | `ts/game/ChessGame.ts` |
| 7 | High | Negative index in navigation | `ts/game/GameNavigate.ts` |
| 8 | High | Dead code in clock | `ts/game/GameClock.ts` |
| 9 | High | No promotion piece validation | `ts/game/GamePromotion.ts` |
| 10 | Medium | Untyped error constructors | `ConfigError`, `GameError`, `EngineError` |
| 11 | Medium | `any` cast in IndexedDB | `ts/clvq/ClvqIndexedDB.ts` |
| 12 | Medium | Callback typed as `any` | `ts/game/GamePromotion.ts` |
| 13 | Medium | DB tests have no assertions | `ts/testing/clvq/db_test.ts` |
| 14 | Medium | No tests for clock/captures/nav/promotion | `ts/testing/` |
| 15 | Low | `console.log` vs `console.debug` | `ts/game/GameMove.ts` |
| 16 | Low | Magic string element IDs | Multiple |
