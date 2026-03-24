# Lichess.org Integration Plan

## What the Lichess Board API offers

- **Auth:** OAuth2 with PKCE (no client secret needed, no registration required — just pick a client ID)
- **Token lifetime:** ~1 year, stored in localStorage
- **Required scope:** `board:play`
- **Game types allowed:** Rapid, Classical, Correspondence only (no Bullet/Blitz via Board API)
- **Communication:** Long-lived NDJSON streams — one for incoming challenges, one per active game
- **Move format:** Algebraic notation (`e2e4`), not SAN — conversion step needed from chess.js output
- **Engine assistance:** Forbidden (Board API is for humans only)

---

## Phase 1 — Authentication (OAuth2 + PKCE) ✓ DONE

The entire integration is gated on this.

- ✓ Implement PKCE flow in the browser: generate `code_verifier` → derive `code_challenge` → redirect to `https://lichess.org/oauth` → receive authorization code → exchange for token at `https://lichess.org/api/token`
- ✓ Store the access token in `localStorage`
- ✓ Add a "Login with lichess" button to the UI
- ✓ Add a logout action that clears the token
- ✓ Fetch and display the logged-in user's profile (`/api/account`) — username, rating, title

**Module:** `ts/lichess/LichessAuth.ts`

---

## Phase 2 — API & Streaming Layer ✓ DONE

A thin HTTP + NDJSON streaming client, no third-party library needed.

- ✓ HTTP client wrapper with bearer token injection and rate-limit (HTTP 429) handling
- ✓ NDJSON stream reader (read line-by-line, parse JSON, dispatch events)
- ✓ Two persistent streams to manage:
  - **Event stream** (`/api/stream/event`) — receives incoming challenges
  - **Game stream** (`/api/board/game/stream/{gameId}`) — receives live game updates
- ✓ Exponential backoff reconnect (capped at 60s) on disconnect

**Modules:** `ts/lichess/LichessClient.ts`, `ts/lichess/LichessStream.ts`

---

## Phase 3 — Game Flow (Seek & Challenge) ✓ DONE

- ✓ Create a seek for a casual game (`POST /api/board/seek`) — picks a random opponent
- ✓ Accept incoming challenges from the event stream
- ✓ Abort, resign, offer/accept draw, offer/accept takeback

**Module:** `ts/lichess/LichessGame.ts`

---

## Phase 4 — Board Integration (Online Mode)

This is the core wiring into the existing game architecture.

- Add a `LichessGameState` implementing the existing `GameState` interface — instead of saving to IndexedDB it syncs with the lichess stream
- Add a new `EventOpponentMove` custom DOM event (mirrors `EventBoardMove` but comes from the stream)
- Wire `ChessGame` to:
  - Disable Chessground input when it's the opponent's turn
  - Submit our moves via `POST /api/board/game/{gameId}/move/{move}` (converting chess.js SAN → algebraic)
  - Receive opponent moves from the game stream and play them on the board
- Clock: use server-provided times from the stream (authoritative), not local timer alone
- Handle game-end events from the stream (checkmate, timeout, resign, draw)

---

## Phase 5 — UI Changes

Minimal new UI needed:

- **Login/logout area** in the navbar (shows username + rating when logged in)
- **"Play on lichess" mode selector** in the game setup modal — replaces the local time sliders with time control presets (Rapid 10+0, 15+10, etc.)
- **Incoming challenge notification** — a modal or banner when a challenge arrives from the event stream
- **Opponent info panel** — opponent username and rating displayed in the player sidebar
- **Game actions:** Resign, Offer Draw, Abort buttons (only relevant in online mode)

---

## Phase 6 — Game History & PGN

Once games are being played, this becomes useful:

- Fetch completed games from lichess (`/api/games/user/{username}`)
- PGN export using moves SAN already stored in game state
- Display game archive locally

---

## Key Technical Decisions

| Decision | Resolution |
|---|---|
| Move conversion (SAN → algebraic) | chess.js provides `from`/`to` squares already — use those directly |
| Stream reconnect strategy | Exponential backoff on disconnect |
| Token storage | `localStorage` (consistent with existing config storage plan) |
| Online vs local mode | Flag in `GameDeps` or separate `ChessGame` subclass |
| Clock sync | Use server times from stream, update local `GameClock` on each move event |

---

## Work Order

```
Phase 1 — Auth (PKCE flow, token storage, user profile)          ✓ DONE
Phase 2 — API/Stream layer (HTTP client, NDJSON reader)           ✓ DONE
Phase 3 — Game flow (seek, challenge, resign, draw)               ✓ DONE
Phase 4 — Board integration (online mode, opponent moves, clock sync)
Phase 5 — UI (login, mode selector, challenge modal, opponent info)
Phase 6 — History & PGN (optional, post-core)
```

Phases 1–3 can be developed and tested in isolation without touching the existing game code.
Phase 4 is where the integration lands.
Phase 5 is incremental UI work on top.
Phase 6 is optional post-core work.
