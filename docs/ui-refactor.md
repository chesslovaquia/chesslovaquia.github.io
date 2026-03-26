# UI Refactor Plan — New Hugo Theme

## Goal

Replace the current `clvq` Hugo theme with a new `clvq2` theme built on modern
CSS (no w3.css). The guiding principle is **"just a chessboard"** — the board
dominates the interface; everything else stays out of the way until needed.

---

## Why a New Theme

- **w3.css is the bottleneck.** Verbose class soup (`w3-bar-item w3-button
  w3-round-large w3-hover-lime w3-hover-opacity w3-border w3-border-dark-grey`),
  limited flexbox/grid support, and quirks like the `position: relative` override
  inside `.w3-bar` that already required inline-style workarounds.
- **Separate desktop/mobile layouts** (`game-desktop.html`, `game-mobile.html`)
  duplicate structure. A single responsive layout with CSS grid is cleaner.
- **Visual clutter on the game page** — menu dropdown, 5-button navbar, two
  full player bars, status bar, plus 8 modals. Too much chrome for a board app.
- **No typography or spacing system** — the current dark palette (`#1a1a1a` /
  `#252525` / `#353535` with lime accents) has no consistent scale.

Creating a second theme lets us iterate without breaking the working UI.
Switching is a one-line change in `hugo.toml` (`theme = "clvq2"`).

---

## Design Principles

1. **Board-first.** The chessboard fills the available space. On desktop it is
   vertically centered; on mobile it spans full width.
2. **Minimal chrome.** Player info (name, clock, material) hugs the board
   edges directly — no separate panel. Everything else hides behind a single
   menu icon.
3. **One responsive layout.** CSS grid handles desktop vs. mobile — no
   duplicate Hugo templates.
4. **Modern CSS only.** Custom properties for theming, `grid` / `flexbox` for
   layout, `container queries` for component-level responsiveness. No framework.
5. **Dark by default.** Refine the existing dark palette with a proper spacing
   and typography scale.

---

## Current Theme Inventory

What exists in `themes/clvq/` today (to inform what the new theme must cover):

### Layouts

| File | Purpose |
|------|---------|
| `_default/baseof.html` | Root `<html>` shell — `<head>` + `<body>` |
| `_default/home.html` | Home/setup page — time control buttons, PWA registration |
| `_default/single.html` | Generic content page (about, system, 404) |
| `page/game-desktop.html` | Game — two-column: board left, UI right (`w3-half`) |
| `page/game-mobile.html` | Game — single column: board full-width, UI stacked below |
| `page/about.html` | About page |
| `page/devel.html` | Development test page (draft) |
| `page/system.html` | Build/system info |
| `page/notfound.html` | 404 |

### Partials (23 files)

**Structural:** `head.html`, `header.html`, `footer.html`, `menu.html`,
`head/css.html`, `head/js.html`, `page/main-head.html`, `page/main-tail.html`

**Game UI:** `game/game-menu.html`, `game/game-navbar.html`,
`game/game-player.html`, `game/game-status.html`,
`game/game-setup-buttons.html`, `game/game-main-head.html`,
`game/game-main-tail.html`, `game/game-modals.html`

**Modals (8):** `modal/pawn-promotion.html`, `modal/game-outcome.html`,
`modal/game-setup-lichess.html`, `modal/lichess-challenge.html`,
`modal/game-setup-custom.html`, `modal/game-setup-correspondence.html`,
`modal/game-history.html`, `modal/internal-error.html`

### CSS

| File | Size | Role |
|------|------|------|
| `w3.css` | ~4KB min | Responsive framework (to be dropped) |
| `main.css` | ~30 lines | Font defaults, headings, hr |
| `clvq.css` | ~10 lines | 3 background classes, icon sizing |
| `game.css` | ~80 lines | Board sizing, clock states, setup buttons, material |
| `chessground.wood4.css` | vendored | Board texture (keep as-is) |
| `fontawesome/` | vendored | Icons (keep as-is) |

### Config-Driven Params (from `config/_default/config.yaml`)

```yaml
btnClass: "w3-button w3-round-large w3-hover-lime ..."
menuBtnClass: "w3-button w3-round-large w3-hover-lime ..."
modalContentClass: "w3-modal-content w3-round-large w3-padding-large ..."
css_load: [w3.css, main.css, clvq.css, chessground.*, game.css, fontawesome.*]
```

These params are consumed by partials — the new theme will define its own params
and won't need the w3.css-specific ones.

### HTML Element IDs (TypeScript contract)

The TypeScript layer discovers elements by ID via `ElementIds.*` constants.
**The new theme must produce the same IDs** — this is the interface contract
between HTML and TS. Key IDs:

- Board: `chessboard`
- Players: `gamePlayer1`, `gamePlayer2`, `gamePlayerRating1`, `gamePlayerRating2`
- Clocks: `gameClock1`, `gameClock2`
- Material: `gameMaterial1`, `gameMaterial2`, `gameMaterialCount1`, `gameMaterialCount2`
- Navigation: `gameFlipBoard`, `gameNavFirstMove`, `gameNavBackward`, `gameNavForward`, `gameNavLastMove`
- Status: `gameDescription`, `gameStatus`
- Menu/actions: `gameMenu`, `gameReset`, `gameActionsBar`, `gameAbort`, `gameResign`, `gameOfferDraw`
- Modals: `clvqInternalError`, `whitePawnPromotion`, `blackPawnPromotion`,
  `gameOutcomeModal`, `lichessSeekModal`, `lichessChallengeModal`,
  `gameSetupCustom`, `gameSetupCorrespondence`, `gameHistoryModal`
- Lichess: `lichessMenu`, `lichessLogin`, `lichessLogout`, `lichessUser`
- Mobile: `mobileMenu`

### TypeScript Integration Points

The theme calls into TypeScript via global `Clvq.*` methods on `onclick`
attributes and inline `<script>` blocks. These must be preserved:

- `Clvq.gameSetup(minutes, increment)` — time control buttons
- `Clvq.w3ShowModal(id)` / `Clvq.w3HideModal(id)` / `Clvq.w3ToggleMenu(id)` — modal control
- `Clvq.loadHistory()` — history modal
- `Clvq.lichessAbort()` / `Clvq.lichessResign()` / `Clvq.lichessOfferDraw()` — game actions
- `Clvq.exportPgn(index)` — PGN export from history list
- Inline `<script>` blocks in modals (sliders, submit handlers)

**Note:** The modal show/hide methods (`w3ShowModal`, `w3HideModal`,
`w3ToggleMenu`) currently rely on w3.css display toggling. The new theme will
need its own modal mechanism, and these methods in `Clvq.ts` will need updating
to match. This is the one place where TypeScript changes are expected.

---

## New Theme Structure

```
themes/clvq2/
├── theme.toml
├── hugo.toml
├── layouts/
│   ├── _default/
│   │   ├── baseof.html        # <html> shell, CSS custom properties
│   │   ├── home.html          # Setup screen: time control grid
│   │   └── single.html        # Generic content pages
│   ├── page/
│   │   ├── game.html          # Single responsive game layout (replaces desktop + mobile)
│   │   ├── about.html
│   │   ├── system.html
│   │   ├── devel.html
│   │   └── notfound.html
│   └── partials/
│       ├── head.html          # <head> meta, CSS, JS loading
│       ├── header.html        # Minimal top bar (logo + menu icon)
│       ├── footer.html
│       ├── menu.html          # Slide-out or dropdown: lichess login, navigation
│       ├── game/
│       │   ├── board.html     # Board container with player info hugging edges
│       │   ├── player.html    # Compact: name + clock + material in one row
│       │   ├── controls.html  # Nav buttons (compact, below board)
│       │   ├── status.html    # Game status
│       │   └── actions.html   # Online game actions (contextual)
│       └── modal/
│           ├── base.html      # Shared modal shell (replaces w3-modal pattern)
│           ├── promotion.html
│           ├── outcome.html
│           ├── setup-time.html      # Lichess time control
│           ├── setup-custom.html    # Custom time/increment sliders
│           ├── setup-correspondence.html
│           ├── challenge.html
│           ├── history.html
│           └── error.html
├── assets/
│   └── css/
│       ├── variables.css      # Custom properties: colors, spacing, typography
│       ├── reset.css          # Minimal CSS reset
│       ├── layout.css         # Grid/flexbox layout system
│       ├── components.css     # Buttons, modals, menus, player bars
│       ├── game.css           # Board sizing, clock states
│       └── utilities.css      # Handful of utility classes (hidden, sr-only, etc.)
└── static/
    └── favicon.ico
```

Vendored assets (`chessground.*.css`, `fontawesome/`, board textures) stay in
the shared `themes/clvq/assets/` or move to top-level `assets/` — Hugo's asset
pipeline resolves from both.

---

## Implementation Plan

### Phase 1 — Scaffold and Basic Layout

1. Create `themes/clvq2/` directory structure.
2. Write `variables.css` — define the design tokens (colors, spacing scale,
   font sizes, border radii).
3. Write `reset.css` and `layout.css` — CSS grid system for the game page.
4. Create `baseof.html` — clean `<html>` shell loading the new CSS.
5. Create `page/game.html` — single responsive layout:
   - CSS grid: on wide screens, board takes left column (~60%), controls take
     right; on narrow screens, single column with board on top.
   - Player info (name, clock, material) rendered directly above/below the
     board, not in a separate panel.
6. Verify the board renders and Chessground initializes — all element IDs must
   match `ElementIds.*`.
7. Update `content/play/desktop.md` and `content/play/mobile.md` to both use
   `layout: game` (or merge into a single `content/play.md`).

### Phase 2 — Components

1. Build the modal system in pure CSS/JS — a `<dialog>` element or a custom
   `data-modal` pattern with CSS transitions. Update `Clvq.ts` modal methods.
2. Port all 8 modals to the new `modal/` partials.
3. Build the menu — single icon that opens a slide-out panel or dropdown with:
   lichess login/logout, reset, play on lichess, history, online actions.
4. Style time control buttons for the home/setup page.
5. Port the move navigation bar (5 buttons) — make it compact, icon-only.

### Phase 3 — Polish

1. Typography and spacing pass — consistent vertical rhythm.
2. Clock styling — active/warning/alert/timeout states with the new palette.
3. Player info — material icons, rating display.
4. Transitions and micro-interactions (modal open/close, button hover).
5. Dark/light theme toggle via custom property swap (stretch goal).

### Phase 4 — Cutover

1. Test all game flows end-to-end: local play, lichess seek/challenge/resign,
   history, PGN export.
2. Test responsive behavior across breakpoints.
3. Run full `make test` — TypeScript tests must pass unchanged (except any
   modal method updates).
4. Switch `hugo.toml` to `theme = "clvq2"`.
5. Keep `themes/clvq/` in the repo for rollback.

---

## Content Page Changes

The current setup has two game pages:

```
content/play/desktop.md  →  layout: game-desktop
content/play/mobile.md   →  layout: game-mobile
```

With the new single responsive layout, these merge into one:

```
content/play.md  →  layout: game
```

The TypeScript `screen.ts` module that redirects between desktop/mobile based on
viewport width can be simplified or removed — CSS handles the responsive
behavior.

---

## CSS Architecture

No framework. The stylesheet is split by concern:

```css
/* variables.css — design tokens */
:root {
  --clvq-bg-0: #121212;     /* deepest background */
  --clvq-bg-1: #1e1e1e;     /* surface */
  --clvq-bg-2: #2a2a2a;     /* elevated surface */
  --clvq-bg-3: #363636;     /* highest surface */
  --clvq-accent: #a3d977;   /* softer green — less harsh than lime */
  --clvq-text: #e0e0e0;     /* primary text */
  --clvq-text-dim: #888;    /* secondary text */
  --clvq-danger: #e57373;   /* alerts, timeouts */
  --clvq-warning: #ffb74d;  /* clock warning */
  --clvq-radius: 8px;       /* consistent border radius */
  --clvq-space-xs: 4px;
  --clvq-space-sm: 8px;
  --clvq-space-md: 16px;
  --clvq-space-lg: 24px;
  --clvq-space-xl: 32px;
  --clvq-font-sm: 0.875rem;
  --clvq-font-md: 1rem;
  --clvq-font-lg: 1.25rem;
}
```

```css
/* layout.css — game page grid (sketch) */
.game-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr;
  min-height: 100dvh;
}

@media (min-width: 768px) {
  .game-layout {
    grid-template-columns: minmax(0, 1fr) minmax(300px, 400px);
    grid-template-rows: auto 1fr;
  }
}
```

```css
/* components.css — modal system (sketch) */
.modal {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.7);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}
.modal.active {
  opacity: 1;
  visibility: visible;
}
.modal-content {
  background: var(--clvq-bg-2);
  border-radius: var(--clvq-radius);
  padding: var(--clvq-space-lg);
  max-width: 90vw;
}
```

---

## Migration Risks

| Risk | Mitigation |
|------|------------|
| Missing element IDs break TypeScript | Checklist of all `ElementIds.*` — verify each is present in new templates before testing |
| Modal show/hide methods tied to w3.css | Update `Clvq.ts` modal helpers to use `.active` class toggle instead of w3.css display manipulation |
| Inline `onclick` handlers reference `Clvq.*` globals | Preserve all global method signatures; only internal implementation changes |
| Chessground CSS conflicts with new styles | Load chessground CSS in isolation (scoped to `#chessboard`); test piece rendering early |
| Content pages reference specific layouts | Update frontmatter to point to new layout names |
| `screen.ts` redirect logic assumes two pages | Simplify to detect if on game page; remove desktop/mobile branching |

---

## Non-Goals (for this refactor)

- **No TypeScript rewrite.** The theme controls HTML and CSS only. The only TS
  changes are the modal show/hide method implementations in `Clvq.ts`.
- **No new features.** This is a visual/structural refactor, not a feature release.
- **No changes to game logic, storage, or lichess integration.**
- **No server-side rendering or JS framework adoption.**
