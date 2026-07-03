# Multiplayer Memory Card Game

## What This Is

A production-ready real-time multiplayer Memory Card Game for 2 players built with Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, Socket.IO, and Framer Motion. The application allows players to create/join rooms, play in real-time, toggle light/dark modes, view as spectators if a room is full, and experience high-quality animations and audio.

## Core Value

Provide a seamless, server-authoritative, real-time multiplayer memory game experience with rich visuals, synchronized game state, and zero client-side cheating.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Real-time Socket.IO synchronization of board state, flips, turns, scores, timer, and game end.
- [ ] Server-authoritative game logic (shuffling, move validation, turn switching, score updates) to prevent cheating.
- [ ] Robust disconnection and reconnection handling for players, with auto-win for the remaining player on permanent departure.
- [ ] Beautiful and responsive UI using Tailwind CSS, shadcn/ui, and Framer Motion for card flip animations and modals.
- [ ] Dark and light theme switcher following OS preferences (`prefers-color-scheme`) by default, persisted in `localStorage`.
- [ ] Spectator mode automatically enabled for players joining a room that already has 2 active players.
- [ ] Sound effects for card flips, matches, and victory with a mute/unmute toggle.
- [ ] Accessible interface with keyboard navigation, visible focus, ARIA labels, and reduced motion support.

### Out of Scope

- [ ] Full user authentication and profile persistence — Room codes are used for matchmaking, and usernames are session-based (temporary).
- [ ] Global matchmaking lobbies — Matchmaking is room-code-based (invite-only).

## Context

- **Frontend Environment**: Next.js 15 App Router deployed to Vercel.
- **Backend Environment**: Standalone Node.js server hosted on Railway, Render, or Fly.io running a Socket.IO server.
- **State Management**: Zustand for local/client state; server state synchronized via Socket.IO events.

## Constraints

- **Architecture**: Next.js serverless functions cannot hold persistent WebSocket connections, so the Socket.IO server must be hosted on a separate persistent platform (Railway, Render, Fly.io).
- **Performance**: High frequency game timer updates and animations must perform smoothly on mobile, tablet, and desktop viewports.
- **Authoritative Server**: Client cannot decide whether a card is matched or switch turns; all core game state transitions must originate from the server.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Standalone Node.js server with Socket.IO | Socket.IO requires persistent connections not supported by Vercel serverless functions. | — Pending |
| Web development tech stack card icons | Matches developer audience and looks premium with Vercel-inspired dark theme. | — Pending |
| Automatic spectator mode | Simplifies flow for extra users joining a full room without complex screen routing. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-02 after initialization*
