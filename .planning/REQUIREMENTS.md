# Requirements: Multiplayer Memory Card Game

**Defined:** 2026-07-02
**Core Value:** Provide a seamless, server-authoritative, real-time multiplayer memory game experience with rich visuals, synchronized game state, and zero client-side cheating.

## v1 Requirements

### Infrastructure & Setup

- [ ] **INFRA-01**: Next.js 15 (App Router) project is bootstrapped with TypeScript, Tailwind CSS, shadcn/ui, ESLint, and Prettier.
- [ ] **INFRA-02**: Standalone Node.js Socket.IO server is set up in a `server/` directory with its own `package.json` and TypeScript configuration.
- [ ] **INFRA-03**: Both the Next.js client and the Socket.IO server can be started simultaneously in development with a single command (`concurrently`).
- [ ] **INFRA-04**: Environment variables are defined for `NEXT_PUBLIC_SOCKET_SERVER_URL` (frontend) and `PORT` (backend), with `.env.example` provided.
- [ ] **INFRA-05**: Project can be deployed to Vercel (frontend) + Railway/Render (backend) with documented environment configuration.

### Lobby & Room Management

- [ ] **ROOM-01**: User can navigate to the Landing Page (`/`) with a Vercel-inspired Navbar, hero section, and clear CTA buttons to create or join a room.
- [ ] **ROOM-02**: User can create a game room at `/create` and receive a unique room code (6 character alphanumeric).
- [ ] **ROOM-03**: User can join an existing room at `/join` by entering a room code and a display name.
- [ ] **ROOM-04**: User sees a Waiting Room screen at `/game/[roomId]` after creating/joining, showing connected players and a "waiting for opponent" indicator.
- [ ] **ROOM-05**: User can copy the room code to clipboard with a single click.
- [ ] **ROOM-06**: User can share the room link directly via the native Share API (or clipboard fallback).
- [ ] **ROOM-07**: Game starts automatically for both players when 2 players have joined the room.
- [ ] **ROOM-08**: If a third user tries to join a full room (2 active players), they are automatically assigned spectator mode.

### Core Game Engine (Server-Side)

- [ ] **GAME-01**: Server shuffles 24 cards (12 pairs) on game start using a cryptographically random algorithm; card values are never sent to the client until flipped.
- [ ] **GAME-02**: Server enforces alternating turns — only the active turn player's flip events are processed; other players' flip events are silently rejected.
- [ ] **GAME-03**: Server validates card flips: rejects clicks on already-flipped or matched cards.
- [ ] **GAME-04**: Server rejects flip events while a pair is being evaluated (prevents rapid-click exploit).
- [ ] **GAME-05**: If a player successfully matches a pair, their score increments by 1 and they play again (turn does not switch).
- [ ] **GAME-06**: If a player's two flipped cards do not match, cards are flipped back after a 1-second delay and the turn switches to the other player.
- [ ] **GAME-07**: Game ends when all 12 pairs are matched; server emits a game-over event with final scores and winner determination.
- [ ] **GAME-08**: Winner is the player with the highest score; if scores are equal, result is declared a Draw.
- [ ] **GAME-09**: Server maintains a game timer (elapsed time since game start) and broadcasts it to all players in the room at regular intervals.
- [ ] **GAME-10**: Server counts the total number of moves (card flips) per player.

### Real-Time Synchronization

- [ ] **SYNC-01**: All card flip actions are broadcast to all participants in the room (players and spectators) in real-time.
- [ ] **SYNC-02**: Score updates are broadcast to all participants immediately after a match is evaluated.
- [ ] **SYNC-03**: Turn changes are broadcast to all participants so all UIs update the active player indicator simultaneously.
- [ ] **SYNC-04**: Game timer is synchronized via server-emitted ticks rather than client-side intervals.
- [ ] **SYNC-05**: Game-end state (winner, final scores, all matched cards) is broadcast to all participants simultaneously.

### Game UI — Game Board & Cards

- [ ] **BOARD-01**: Game board displays a responsive 4×6 grid of 24 face-down cards centered on the screen.
- [ ] **BOARD-02**: Each card displays a smooth 3D flip animation (using Framer Motion) when selected, revealing a web dev tech-stack icon.
- [ ] **BOARD-03**: Cards already matched remain face-up and visually distinguished (e.g., reduced opacity or a "matched" ring) for the rest of the game.
- [ ] **BOARD-04**: The active player cannot click any card while the board is locked (two unmatched cards visible, or waiting for server validation).
- [ ] **BOARD-05**: A turn indicator prominently shows "Your Turn" or "Opponent's Turn" so players always know who acts next.
- [ ] **BOARD-06**: A scoreboard shows each player's name, score, and move count in real-time.

### Multiplayer Edge Cases — Disconnect & Reconnect

- [ ] **CONN-01**: If a player disconnects, the server starts a 30-second reconnection countdown; the remaining player is notified with a banner.
- [ ] **CONN-02**: A disconnected player can reconnect within 30 seconds and have their full game state (board, scores, turn) restored.
- [ ] **CONN-03**: If the disconnected player does not reconnect within 30 seconds, the remaining player is automatically declared the winner.
- [ ] **CONN-04**: A "Reconnecting…" banner is displayed on the reconnecting player's screen while the socket re-establishes.

### Theme & Styling

- [ ] **THEME-01**: Application uses Tailwind CSS dark mode following the user's OS preference (`prefers-color-scheme`) by default.
- [ ] **THEME-02**: User can manually switch between Light, Dark, and System themes via a dropdown in the Navbar.
- [ ] **THEME-03**: Theme preference is persisted in `localStorage` and applied on page load to avoid flash of wrong theme.
- [ ] **THEME-04**: Theme transitions are smooth (CSS transitions applied to background-color and color).
- [ ] **THEME-05**: UI uses glassmorphism panels, subtle gradients, rounded-xl corners, and soft shadows consistent with Vercel's design language.

### Winner & Game End

- [ ] **END-01**: When the game ends, a Winner Modal appears with the winner's name, final scores, and a confetti burst animation.
- [ ] **END-02**: Players can request a Rematch from the Winner Modal; both players must accept before a new game starts.
- [ ] **END-03**: Players can leave the room from the Winner Modal; a Leave Room Dialog confirms the action.

### Sound Effects & Audio

- [ ] **AUDIO-01**: A flip sound plays when a card is turned face-up.
- [ ] **AUDIO-02**: A match sound plays when a pair is successfully matched.
- [ ] **AUDIO-03**: A victory sound plays when the game ends with a winner.
- [ ] **AUDIO-04**: User can toggle all sound effects on/off via a button in the Navbar; preference is saved in `localStorage`.
- [ ] **AUDIO-05**: No audio plays before the user's first interaction with the page (browser autoplay policy compliance).

### Accessibility

- [ ] **A11Y-01**: All interactive elements (cards, buttons, inputs) are keyboard-navigable using Tab and Enter/Space.
- [ ] **A11Y-02**: All interactive elements have visible focus rings.
- [ ] **A11Y-03**: ARIA labels and roles are applied to dynamic elements (game status, scoreboard, modals, cards).
- [ ] **A11Y-04**: Card flip animations respect `prefers-reduced-motion` — reduced motion users see instant reveals instead of 3D flip.

### Bonus Features

- [ ] **BONUS-01**: Players can send emoji reactions (5 emoji options) during gameplay; reactions appear as floating animations on all participants' screens.
- [ ] **BONUS-02**: Toast notifications are shown for key game events (room created, player joined, player disconnected, match found).
- [ ] **BONUS-03**: Loading skeletons are shown for the game board while the server initializes the game state.
- [ ] **BONUS-04**: Error boundaries wrap the game page to display a friendly error screen instead of crashing.
- [ ] **BONUS-05**: Spectators can view the board in real-time but cannot interact with cards or reactions.

### Documentation

- [ ] **DOCS-01**: `README.md` is generated covering installation, development setup, environment variables, deployment to Vercel + Railway, architecture overview, game rules, folder structure, and future improvements.

---

## v2 Requirements

### Profiles & Persistence

- **PROF-01**: User can create a persistent profile with a username, avatar, and win/loss record.
- **PROF-02**: Match history is stored in a database (e.g., PostgreSQL + Prisma).
- **PROF-03**: A global leaderboard ranks players by win rate.

### Extended Gameplay

- **GAME-V2-01**: Custom card deck uploads — players can upload image packs for cards.
- **GAME-V2-02**: Solo mode vs AI opponent (computer).
- **GAME-V2-03**: Configurable board sizes (e.g., 4×4, 5×4, 6×6).

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Global matchmaking lobby | High complexity, toxic user risk, scaling cost — invite-only rooms are simpler and safer for v1. |
| OAuth login / full authentication | Not needed for casual session-based play; usernames are ephemeral per session. |
| Mobile native app (iOS / Android) | Web-first; native app is a v2+ consideration. |
| Database persistence of game state | In-memory room state is sufficient for v1 casual play. |
| Multi-team or 3+ player modes | Scope-limiting to 2 players for clean game balance and simpler server logic. |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 7 | Pending |
| ROOM-01 | Phase 4 | Pending |
| ROOM-02 | Phase 4 | Pending |
| ROOM-03 | Phase 4 | Pending |
| ROOM-04 | Phase 4 | Pending |
| ROOM-05 | Phase 4 | Pending |
| ROOM-06 | Phase 4 | Pending |
| ROOM-07 | Phase 2 | Pending |
| ROOM-08 | Phase 5 | Pending |
| GAME-01 | Phase 2 | Pending |
| GAME-02 | Phase 2 | Pending |
| GAME-03 | Phase 2 | Pending |
| GAME-04 | Phase 2 | Pending |
| GAME-05 | Phase 2 | Pending |
| GAME-06 | Phase 2 | Pending |
| GAME-07 | Phase 2 | Pending |
| GAME-08 | Phase 2 | Pending |
| GAME-09 | Phase 2 | Pending |
| GAME-10 | Phase 2 | Pending |
| SYNC-01 | Phase 3 | Pending |
| SYNC-02 | Phase 3 | Pending |
| SYNC-03 | Phase 3 | Pending |
| SYNC-04 | Phase 3 | Pending |
| SYNC-05 | Phase 3 | Pending |
| BOARD-01 | Phase 3 | Pending |
| BOARD-02 | Phase 3 | Pending |
| BOARD-03 | Phase 3 | Pending |
| BOARD-04 | Phase 3 | Pending |
| BOARD-05 | Phase 3 | Pending |
| BOARD-06 | Phase 3 | Pending |
| CONN-01 | Phase 5 | Pending |
| CONN-02 | Phase 5 | Pending |
| CONN-03 | Phase 5 | Pending |
| CONN-04 | Phase 5 | Pending |
| THEME-01 | Phase 6 | Pending |
| THEME-02 | Phase 6 | Pending |
| THEME-03 | Phase 6 | Pending |
| THEME-04 | Phase 6 | Pending |
| THEME-05 | Phase 6 | Pending |
| END-01 | Phase 3 | Pending |
| END-02 | Phase 5 | Pending |
| END-03 | Phase 4 | Pending |
| AUDIO-01 | Phase 6 | Pending |
| AUDIO-02 | Phase 6 | Pending |
| AUDIO-03 | Phase 6 | Pending |
| AUDIO-04 | Phase 6 | Pending |
| AUDIO-05 | Phase 6 | Pending |
| A11Y-01 | Phase 7 | Pending |
| A11Y-02 | Phase 7 | Pending |
| A11Y-03 | Phase 7 | Pending |
| A11Y-04 | Phase 7 | Pending |
| BONUS-01 | Phase 6 | Pending |
| BONUS-02 | Phase 6 | Pending |
| BONUS-03 | Phase 3 | Pending |
| BONUS-04 | Phase 7 | Pending |
| BONUS-05 | Phase 5 | Pending |
| DOCS-01 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-02*
*Last updated: 2026-07-02 after initial definition*
