# Roadmap: Multiplayer Memory Card Game

## Overview

Seven phases take the project from zero to a production-ready, Vercel-deployed, multiplayer Memory Card Game. The project starts by establishing the dual-server architecture (Next.js + standalone Socket.IO), builds the authoritative game engine, then layers in the real-time UI, lobby flow, edge-case handling (disconnects/reconnects/spectators), polish (theme, audio, animations, bonus features), and finally deployment hardening and accessibility compliance. Each phase delivers working, testable vertical slices of the product.

## Phases

- [x] **Phase 1: Foundation** — Bootstrap Next.js frontend and standalone Socket.IO server with shared TypeScript types and local dev setup
- [x] **Phase 2: Game Engine** — Server-side room management, card shuffling, flip validation, turn logic, scoring, and game-end detection
- [ ] **Phase 3: Game UI & Sync** — Game board, card flip animations, real-time synchronization of state, scoreboard, and winner modal
- [ ] **Phase 4: Lobby Flow** — Landing page, Create Room, Join Room, Waiting Room, room code copy/share, and Leave Room dialog
- [ ] **Phase 5: Edge Cases** — Disconnect detection, reconnection grace window, auto-win, spectator mode, and rematch
- [ ] **Phase 6: Polish** — Theme switcher (light/dark/system), audio effects, emoji reactions, confetti, toast notifications, loading skeletons, and error boundaries
- [ ] **Phase 7: Deployment & Accessibility** — Vercel + Railway deployment config, keyboard navigation, ARIA labels, reduced motion, ESLint/Prettier, and README

---

## Phase Details

### Phase 1: Foundation
**Goal:** A working dual-server dev environment — Next.js 15 app with Tailwind/shadcn/Zustand running on port 3000 and a standalone Socket.IO server on port 3001, startable with a single `npm run dev` command.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` starts both the Next.js client and the Socket.IO server concurrently.
  2. The Next.js app loads at `http://localhost:3000` without errors.
  3. The Socket.IO server listens on port 3001 and accepts a test connection from the client.
  4. Shared TypeScript types (`Card`, `Player`, `Room`, `GameState`) compile without errors.
  5. ESLint and Prettier configs are in place and produce no errors on a clean lint pass.

Plans:
- [ ] 01-01: Bootstrap Next.js 15 with TypeScript, Tailwind CSS, shadcn/ui, ESLint, Prettier
- [ ] 01-02: Set up standalone Node.js Socket.IO server with TypeScript and shared types
- [ ] 01-03: Configure `concurrently` dev script, environment variables, and project folder structure

---

### Phase 2: Game Engine
**Goal:** A fully functional server-side game engine — room creation, player joining, server-shuffled 24-card board, turn enforcement, card flip validation, match detection, scoring, move counting, timer broadcasting, and game-end with winner/draw determination.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** ROOM-07, GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, GAME-07, GAME-08, GAME-09, GAME-10
**Success Criteria** (what must be TRUE):
  1. Two Socket.IO clients can create and join a room; the game auto-starts when both have joined.
  2. Clicking a card emits a flip event to the server; the server only processes it if it is that player's turn.
  3. A third card flip while two cards are mid-evaluation is silently rejected by the server.
  4. Matching a pair increments the player's score and keeps their turn; a mismatch switches turns after 1 second.
  5. When all 12 pairs are matched, the server emits a game-over event with correct winner/draw determination.

Plans:
- [x] 02-01: Implement room creation, join, player session management, and in-memory room store
- [x] 02-02: Implement card shuffling, flip validation, match detection, scoring, and turn switching
- [x] 02-03: Implement game-end detection, timer broadcasting, move counting, and rematch signal

---

### Phase 3: Game UI & Sync
**Goal:** A fully wired game screen at `/game/[roomId]` — responsive 4×6 card grid, 3D Framer Motion flip animations, real-time synchronization of all game events (flips, matches, turns, scores, timer), winner modal with confetti, and loading skeletons.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, BOARD-01, BOARD-02, BOARD-03, BOARD-04, BOARD-05, BOARD-06, END-01, BONUS-03
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. Both players see the same card flip animations at the same time with no visible lag.
  2. A matched pair stays face-up with a visual "matched" indicator for the rest of the game.
  3. The turn indicator correctly shows "Your Turn" / "Opponent's Turn" after every turn switch.
  4. Clicking a card while the board is locked (two cards showing or not your turn) has no effect.
  5. When game ends, a Winner Modal appears with final scores and a confetti burst.

Plans:
- [x] 03-01: Build GameBoard, Card components with Framer Motion 3D flip animations and matched-card styling
- [x] 03-02: Wire Socket.IO event handlers for real-time sync (flips, scores, turns, game-end); add Scoreboard and loading skeletons
- [x] 03-03: Build Winner Modal with confetti, final scores, and action buttons

---

### Phase 4: Lobby Flow
**Goal:** Complete lobby UX — Landing page (`/`), Create Room page (`/create`), Join Room page (`/join`), Waiting Room component, room code copy button, native Share API link, and Leave Room confirmation dialog.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** ROOM-01, ROOM-02, ROOM-03, ROOM-04, ROOM-05, ROOM-06, END-03
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. A user can navigate from the Landing page → Create Room → receive a room code → share it.
  2. A second user can navigate from the Landing page → Join Room → enter the code → join the Waiting Room.
  3. When both players are in the Waiting Room, the game screen transitions automatically.
  4. A "Copy Code" button copies the room code to clipboard and shows a success toast.
  5. A "Leave Room" dialog appears before navigating away from an active game or waiting room.

Plans:
- [x] 04-01: Build Landing page with Navbar, hero section, and Create/Join CTAs
- [x] 04-02: Build Create Room page and Join Room page with form validation and routing
- [x] 04-03: Build Waiting Room component, room code copy/share, and Leave Room dialog

---

### Phase 5: Edge Cases — Disconnect, Reconnect & Spectator
**Goal:** Graceful handling of all multiplayer edge cases — 30-second reconnection grace window with server-side countdown, auto-win on permanent departure, reconnect banner with full state restoration, and automatic spectator mode for late joiners.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** CONN-01, CONN-02, CONN-03, CONN-04, ROOM-08, END-02, BONUS-05
**Success Criteria** (what must be TRUE):
  1. When a player disconnects mid-game, the remaining player sees a "Waiting for opponent to reconnect — Xs remaining" banner.
  2. A disconnected player who reconnects within 30 seconds sees their full game state restored immediately.
  3. If 30 seconds pass without reconnection, the remaining player is declared winner automatically.
  4. A third user who joins a room with 2 active players is silently placed into spectator mode and sees the live board.
  5. Rematch request/accept flow works — both players must confirm before a new game resets the board.

Plans:
- [x] 05-01: Implement disconnect detection, 30-second countdown, auto-win, and reconnect-with-state-restore on server
- [x] 05-02: Build Reconnect Banner component and spectator mode UI (read-only board view)
- [x] 05-03: Implement rematch request/accept flow on server and client

---

### Phase 6: Polish — Theme, Audio, Animations & Bonus Features
**Goal:** Full visual and audio polish — light/dark/system theme switcher persisted in localStorage, sound effects (flip/match/win) with mute toggle, emoji reactions with floating animations, toast notification system, and page/modal transition animations via Framer Motion.
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** THEME-01, THEME-02, THEME-03, THEME-04, THEME-05, AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05, BONUS-01, BONUS-02, BONUS-04
**UI hint:** yes
**Success Criteria** (what must be TRUE):
  1. The app respects the OS `prefers-color-scheme` on first load; manually switching themes persists in `localStorage` and survives page reload.
  2. Sounds play on flip, match, and win — and the mute toggle in the Navbar silences all sounds and persists preference.
  3. No sounds trigger on page load before any user interaction.
  4. Clicking an emoji reaction button sends it to all room participants and displays a floating animation on all screens.
  5. Toast notifications appear for: room created, player joined, player disconnected, and match found.

Plans:
- [ ] 06-01: Build ThemeProvider with light/dark/system toggle, localStorage persistence, and smooth CSS transitions
- [ ] 06-02: Implement audio system (flip/match/win sounds) with mute toggle, autoplay-policy compliance, and localStorage persistence
- [ ] 06-03: Build emoji reactions feature with server broadcast and floating Framer Motion animations
- [ ] 06-04: Add Framer Motion page transitions, modal transitions, score increment animations, and toast notification system

---

### Phase 7: Deployment, Accessibility & Documentation
**Goal:** Production-ready project — Vercel + Railway deployment configurations with environment variable documentation, keyboard navigation and ARIA attributes across all interactive elements, reduced motion support, error boundaries, and a comprehensive `README.md`.
**Mode:** mvp
**Depends on:** Phase 6
**Requirements:** INFRA-05, A11Y-01, A11Y-02, A11Y-03, A11Y-04, BONUS-04, DOCS-01
**Success Criteria** (what must be TRUE):
  1. The Next.js frontend deploys successfully to Vercel with the correct `NEXT_PUBLIC_SOCKET_SERVER_URL` environment variable.
  2. The Socket.IO server deploys successfully to Railway/Render with `PORT` configured.
  3. All cards, buttons, and modals are reachable via Tab key and activatable via Enter/Space.
  4. Users with `prefers-reduced-motion` enabled see instant card reveals instead of 3D flip animations.
  5. `README.md` covers installation, dev setup, env vars, deployment, architecture overview, game rules, folder structure, and future improvements.

Plans:
- [ ] 07-01: Configure Vercel deployment (vercel.json, env vars) and Railway/Render deployment (Dockerfile or start script, env vars)
- [ ] 07-02: Implement keyboard navigation, visible focus rings, ARIA labels, and reduced motion support across all components
- [ ] 07-03: Add error boundaries to the game page and write complete README.md

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-07-05 |
| 2. Game Engine | 3/3 | Complete | 2026-07-05 |
| 3. Game UI & Sync | 3/3 | Complete | 2026-07-05 |
| 4. Lobby Flow | 3/3 | Complete | 2026-07-05 |
| 5. Edge Cases | 3/3 | Complete | 2026-07-05 |
| 6. Polish | 0/4 | Not started | - |
| 7. Deployment & Docs | 0/3 | Not started | - |
