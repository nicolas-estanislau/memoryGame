# Project Research Summary

**Project:** Multiplayer Memory Card Game
**Domain:** Real-time Multiplayer Web Games
**Researched:** 2026-07-02
**Confidence:** HIGH

## Executive Summary

This project is a classic 2-player Memory Card Game with real-time synchronization via Socket.IO. The domain is well-understood — memory games are a proven format — but the multiplayer layer adds significant architectural complexity that is the primary engineering challenge. The most critical architectural decision is the **separation of concerns between Next.js (frontend on Vercel) and a standalone Node.js Socket.IO server (on Railway/Render/Fly.io)**. Attempting to run persistent WebSockets in Vercel serverless functions will cause constant disconnections.

The recommended approach is a clean split: Next.js handles all UI, theming, routing, and client state (via Zustand); the standalone server owns all authoritative game state (shuffled board, card values, turns, scores, match validation). Clients send intentions ("I want to flip card 4") and the server emits verified state updates back to all room participants. This model is inherently cheat-proof.

Key risks are rapid-click exploits (addressed via server-side turn locking), stale state on reconnects (addressed via in-memory room cache with 30-second reconnection grace windows), and browser autoplay policy blocking audio (addressed by deferring sound playback until after first user interaction).

## Key Findings

### Recommended Stack

The standard 2025 stack for a real-time multiplayer Next.js game is well-established:

**Core technologies:**
- **Next.js 15 (App Router)**: Full-featured React framework deployed on Vercel for frontend
- **Socket.IO v4**: Battle-tested real-time event layer with auto-reconnection, room management, and WebSocket fallback polling
- **Zustand**: Lightweight client state manager for local UI concerns (mute toggle, theme, socket status, room fields)
- **Framer Motion**: Declarative animation engine for card flips (3D rotations), modal transitions, and page effects
- **Tailwind CSS + shadcn/ui**: Utility-first styling with pre-built accessible components (Dialog, Toast, Dropdown)
- **canvas-confetti**: Simple confetti burst on win condition

### Expected Features

**Must have (table stakes):**
- Room creation / join with unique room code — users expect invite-link multiplayer
- Alternating turns with real-time synchronization — core game mechanic
- Score tracking and winner determination — expected in any competitive card game
- Responsive 4×6 card grid layout — must work on mobile and desktop

**Should have (competitive):**
- Server-authoritative shuffle & validation — eliminates cheating, rare for casual games to implement properly
- Reconnection support (30-second grace window) — prevents frustrating mid-game drops
- Spectator mode — auto-joins as observer if room is full
- Sound effects with mute toggle — standard in polished web games
- Emoji reactions — lighthearted UX differentiator

**Defer (v2+):**
- Persistent user profiles, global leaderboard, custom card packs

### Architecture Approach

The project uses a **two-tier stateless client + stateful server** pattern. The Next.js frontend connects via Socket.IO client to the standalone Node.js server. The server is the single source of truth: it shuffles cards on game start and never exposes card icon values to the client until a player flips that card. All turn validation, match checking, score updating, and win detection happen server-side. Clients display the server-emitted state.

**Major components:**
1. **Next.js Client** — Pages (Landing, Create, Join, Game), Components (GameBoard, Card, Scoreboard, WinnerModal), Hooks (useSocket), Zustand store
2. **Standalone Node.js Server** — Socket.IO event handlers for room CRUD, flip validation, turn management, game loop, disconnect/reconnect logic
3. **In-Memory Room Store** — `Map<roomId, RoomState>` on server; contains full board with icon values, matched card indices, current turn, scores, timer, players

### Critical Pitfalls

1. **Serverless WebSocket termination** — Never host Socket.IO in Vercel API routes. Use Railway/Render for persistent connections.
2. **Rapid double-click exploits** — Server must reject flips when: not player's turn, card already revealed, or 2 flips already pending evaluation.
3. **Stale state on reconnect** — Server must keep room alive for 30s and emit full state snapshot on socket re-association.
4. **Audio autoplay policy** — Sounds must only trigger post first user interaction; include global mute toggle.

## Implications for Roadmap

### Phase 1: Project Setup & Infrastructure
**Rationale:** Must lay the deployment architecture foundation before any game logic. Server/client separation is the hardest constraint to retrofit.
**Delivers:** Next.js app bootstrapped, standalone Node.js socket server set up, both running locally together via `concurrently`, environment variables configured.
**Avoids:** Serverless WebSocket termination pitfall.

### Phase 2: Core Game Engine (Server)
**Rationale:** The authoritative server game logic (shuffle, match validation, scoring) must exist before any UI can be wired up to real data.
**Delivers:** Room creation, player joining, card shuffling, flip validation, turn switching, score tracking, game-end detection — all server-side.
**Avoids:** Client-side shuffle exposé, rapid click exploit.

### Phase 3: Real-Time UI — Game Board & Synchronization
**Rationale:** With game engine ready, the game page and card components can be wired to real socket events.
**Delivers:** Game page at `/game/[roomId]`, GameBoard component, Card with flip animation (Framer Motion), real-time state sync, turn indicator, scoreboard.
**Implements:** Server-authoritative state flow.

### Phase 4: Lobby Flow — Landing, Create, Join & Waiting Room
**Rationale:** Completed game screen makes it possible to verify the room flow end-to-end.
**Delivers:** Landing page (`/`), Create Room page (`/create`), Join Room page (`/join`), Waiting Room component, room code copy/share, lobby countdown.

### Phase 5: Reconnection, Disconnect & Spectator
**Rationale:** After core flow is solid, edge cases (disconnects, reconnects, full rooms) need handling.
**Delivers:** Reconnection banner, 30-second countdown grace window, auto-win on permanent departure, spectator mode for late joiners.
**Avoids:** Stale state desync pitfall.

### Phase 6: Polish — Theme, Audio, Animations, Bonus Features
**Rationale:** Last to implement. Builds on fully working game to add delight layers.
**Delivers:** Light/dark/system theme toggle (localStorage), sound effects with mute toggle, emoji reactions, confetti, rematch request, toast notifications, loading skeletons, error boundaries.
**Avoids:** Audio autoplay pitfall (sounds only trigger post-interaction).

### Phase 7: Deployment, Docs & Accessibility
**Rationale:** Final phase ensures production readiness, accessibility compliance, and developer onboarding docs.
**Delivers:** Vercel + Railway deployment configuration, `README.md` with full setup guide, keyboard navigation, ARIA labels, reduced motion support, ESLint/Prettier config.

### Phase Ordering Rationale

- Server engine before UI: avoids wiring UI to mock data that later conflicts with real server events.
- Lobby after game screen: developers can test the game loop directly before adding pre-game routing.
- Polish last: ensures polish layer is applied to stable UX, not moving targets.

### Research Flags

- **Phase 2:** Server timing logic for 30s reconnect window and concurrent flip locking needs careful testing.
- **Phase 6:** Framer Motion `useReducedMotion` hook should be explicitly applied to card animations for accessibility.

Phases with standard patterns (skip deep research):
- **Phase 1:** Next.js 15 + Tailwind + shadcn setup is completely documented.
- **Phase 7:** Vercel + Railway deployment is cookbook-level.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Next.js + Socket.IO + Zustand is a proven real-time game pattern. |
| Features | HIGH | Feature set is clearly defined by user requirements. |
| Architecture | HIGH | Two-tier separation is the only viable path for Vercel deployment. |
| Pitfalls | HIGH | All pitfalls are well-documented community knowledge. |

**Overall confidence:** HIGH

### Gaps to Address

- **Timer implementation**: Whether game timer is a server-emitted countdown or client-counted needs a decision in Phase 2. Server-emitted is safer for sync; client-counted is lighter on server load.

## Sources

### Primary (HIGH confidence)
- Next.js Documentation — App Router, deployment on Vercel
- Socket.IO v4 Documentation — Rooms, events, reconnection, Redis adapter

### Secondary (MEDIUM confidence)
- Community game development patterns (Socket.IO multiplayer card/board games)

---
*Research completed: 2026-07-02*
*Ready for roadmap: yes*
