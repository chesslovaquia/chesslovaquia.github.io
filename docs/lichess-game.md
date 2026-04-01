# Lichess Game Reconnection & Playing Games List

**Status:** Planned

---

## Problem

When a lichess game starts, `LichessUIBridge` handles the `gameStart` event and
navigates to `/play/` via `window.location.assign`. This destroys all JS state —
the game ID, stream connections, `LichessGame` instance — everything. The game
page (`game.ts`) always creates a local-only `ChessGame` with no lichess
awareness. There is also no `makeMove` endpoint implemented yet.

---

## Phase A: Persist the Lichess Game ID

Store the active game ID in `localStorage` (via `LichessUIBridge`) on
`gameStart`, clear it on `gameFinish`. This survives page navigation/reload —
the only viable bridge in this full-page-navigation architecture.

**Files:**
- `ts/lichess/LichessUIBridge.ts` — add game ID read/write to `localStorage`
- `ts/clvq/Clvq.ts` — pass `ClvqLocalStorage` to `LichessUIBridge`

**Details:**
- New `localStorage` key (e.g. `lichess_game_id`), defined as a private constant
  in `LichessUIBridge` (same pattern as `StorageKey` in `LichessAuth.ts`)
- In the `onGameStart` callback, after setting `_activeGameId`, persist it
- In `onGameFinish`, remove it
- On construction, restore `_activeGameId` from storage
- Add `hasActiveGame()` and `getActiveGameId()` getters

---

## Phase B: Add `makeMove` to `LichessGame`

Implement `POST /api/board/game/{gameId}/move/{move}` — currently missing,
prerequisite for playable online games. Follows the same pattern as `abort`,
`resign`, `draw`.

**Files:**
- `ts/lichess/LichessGame.ts` — add `makeMove(gameId, move)` method
- `ts/testing/testing.ts` — add `makeMove` to `mockLichessGame()`
- `ts/testing/lichess/LichessGame_test.ts` — add test

---

## Phase C: Wire Lichess into the Game Page

When the game page loads and a lichess game ID is persisted, create a
`LichessGameState` instead of `GameStateImpl` and wire up `ChessGame` for online
mode.

**Files:**
- `ts/game/game.ts` — add lichess-aware initialization path
- `ts/lichess/LichessGameState.ts` — make `load()` idempotent

**Details:**
- On load, check `localStorage` for persisted game ID + logged-in user
- If found: create the lichess stack
  (`LichessAuth` -> `LichessClient` -> `LichessStream` -> `LichessGame` ->
  `LichessGameState`)
- Preload the game state (opens the stream, gets `gameFull`, determines player
  color)
- Construct `ChessGame` with `onMove` and `playerColor` set
- Make `LichessGameState.load()` idempotent — on second call (from
  `ChessGame.init()`), return `true` immediately since data is already loaded.
  This avoids opening the game stream twice.

**Sequencing issue:** `ChessGame` reads `deps.playerColor` at construction time,
but the player color is only known after `LichessGameState.load()` processes
`gameFull`. Solution: preload before constructing `ChessGame`:

```typescript
async function lichessGameInit(boardUI: HTMLElement, gameId: string): void {
    const ls = new ClvqLocalStorage();
    const auth = new LichessAuth(ls);
    const client = new LichessClient(auth);
    const stream = new LichessStream(client);
    const lichessGame = new LichessGame(client, stream);
    const user = auth.getUser();

    const deps = newGameDeps(boardUI);
    const lichessState = new LichessGameState(
        lichessGame, deps.engine, deps.clock, deps.nav,
        gameId, user!.id
    );
    deps.state = lichessState;
    deps.onMove = (uci: string) => lichessGame.makeMove(gameId, uci);

    await lichessState.load();
    deps.playerColor = lichessState.getPlayerColor();

    const game = new ChessGame(deps);
    game.init();
}
```

---

## Phase D: Fetch & Display Currently Playing Games

Add a lichess API call to fetch in-progress games and show them on the home page.

**Files:**
- `ts/lichess/LichessPlaying.ts` — new class, calls `GET /api/account/playing`
- `themes/clvq1/layouts/partials/game/playing-games.html` — new partial
- `ts/clvq/ElementIds.ts` — add `lichessPlayingGames`, `lichessPlayingGamesList`
- `ts/clvq/Clvq.ts` — add `lichessResumeGame(gameId)`, wire fetch/display

**API response shape (`GET /api/account/playing`):**
```json
{
  "nowPlaying": [
    {
      "gameId": "abc123",
      "fullId": "abc123defg",
      "color": "white",
      "fen": "...",
      "hasMoved": true,
      "isMyTurn": true,
      "lastMove": "e2e4",
      "opponent": { "id": "bob", "username": "Bob", "rating": 1500 },
      "speed": "rapid",
      "secondsLeft": 450,
      "variant": { "key": "standard", "name": "Standard" }
    }
  ]
}
```

**UI:**
- Container below play mode selector, above setup grid
- Each entry: opponent name/rating, time control, turn indicator, "Resume" button
- Correspondence games: show "Your turn" / "Waiting" instead of a clock
- Resume button persists game ID to `localStorage` and navigates to `/play/`

```typescript
public lichessResumeGame(gameId: string): void {
    const ls = new ClvqLocalStorage();
    ls.setItem('lichess_game_id', gameId);
    window.location.assign('/play/');
}
```

---

## Phase E: Edge Cases

**Stale game IDs:**
- If the game stream returns a terminal status or 404, clear `localStorage` and
  show error / redirect to home
- Handle `gameFull` with terminal status (game finished between `gameStart` event
  and page load)

**Event stream on game page:**
- Run the event stream on `/play/` too so `gameFinish` events properly clear the
  persisted game ID

**Correspondence games:**
- `GameClock.syncTimes()` already handles large ms values
- UI shows "Your turn" / "Waiting" based on `isMyTurn` instead of a countdown
- "Correspondence" displayed as speed category

---

## Implementation Order

1. **Phase B** (makeMove) — standalone, no dependencies
2. **Phase A** (persist game ID) — standalone, no dependencies
3. **Phase C** (game page wiring) — depends on A + B
4. **Phase D** (playing games list + resume) — depends on A
5. **Phase E** (edge cases) — depends on C + D

Phases A and B can be done in parallel.

---

## Risks

- **Dual `load()` calls:** preloading before `ChessGame` construction, then
  `init()` calls `load()` again — solved by idempotent guard
- **Race conditions:** game could finish between `gameStart` event and page load
  — `gameFull` with terminal status must be handled gracefully
- **No SPA:** full page navigation means every reconnect re-creates the entire
  lichess stack from scratch — acceptable but heavier than an SPA approach
