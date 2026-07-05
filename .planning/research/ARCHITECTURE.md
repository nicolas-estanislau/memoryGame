# Architecture Research

**Domain:** Real-time Multiplayer Web Games
**Researched:** 2026-07-02
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Presentation Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Landing │  │ Create  │  │ Join    │  │ Game    │        │
│  │ Page    │  │ Room    │  │ Room    │  │ Page    │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                     State & Network Layer                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │            Zustand Store / Custom Hooks             │    │
│  └──────────────────────────┬──────────────────────────┘    │
│                             │ (Socket.IO Connection)        │
│                             ▼                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │             Standalone Node.js Server               │    │
│  │              (Authoritative State)                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Next.js Client App | Handles user interaction, theme control, client rendering, audio triggering, local store logic, animations. | Next.js 15 (App Router), deployed on Vercel. |
| Zustand Store | Manages local UI state (mute toggle, active theme, socket connection status, temporary room fields). | Standard client store in `store/useGameStore.ts`. |
| Standalone Server | Manages rooms, players, shuffles, validates moves, counts down timers, tracks score transitions, determines wins. | Node.js + Express + Socket.IO, deployed on Railway. |

## Recommended Project Structure

```
├── .planning/                  # Project requirements, roadmap, context
├── server/                     # Standalone Node.js server
│   ├── package.json            # Server configuration
│   ├── server.ts               # Main Socket.IO entry point
│   ├── types.ts                # Shared server types
│   └── gameLogic.ts            # Shuffling, score math, rematch logic
├── app/                        # Next.js frontend (App Router)
│   ├── page.tsx                # Landing Page (/)
│   ├── create/                 # Create Room Page (/create)
│   ├── join/                   # Join Room Page (/join)
│   ├── game/                   # Game layout
│   │   └── [roomId]/           # Game Screen Page (/game/[roomId])
│   ├── layout.tsx              # Root Layout (Theme context provider, navbar wrapper)
│   └── globals.css             # Vanilla CSS + Tailwind layers
├── components/                 # Reusable UI elements
│   ├── Navbar.tsx              # Global navigation bar (Theme switcher, audio toggle)
│   ├── ThemeProvider.tsx       # Handles light/dark switching and localStorage
│   ├── GameBoard.tsx           # Grid container for memory cards
│   ├── Card.tsx                # Individual card (3D rotation animation)
│   ├── Scoreboard.tsx          # Real-time player scores and timers
│   ├── WinnerModal.tsx         # Celebrate victory (Triggers confetti)
│   └── LeaveRoomDialog.tsx     # Confirm exit
├── hooks/                      # Custom hooks (e.g., socket handlers)
│   └── useSocket.ts            # Initializes Socket.IO client instance
├── lib/                        # Static helpers
│   ├── utils.ts                # Tailwind merge helper (cn)
│   └── cardIcons.ts            # SVG Web Stack Icons
└── types/                      # Shared types
    └── index.ts                # TypeScript interfaces (Player, Room, Card, GameState)
```

### Structure Rationale

- **server/** folder is kept separated from Next.js because Vercel Serverless hosting cannot execute long-running socket listeners. Having a distinct server package allows hosting on persistent servers.
- **components/** is structured flat for reusable elements, while route components can live inline or in subdirectories to keep app clean.

## Architectural Patterns

### Pattern 1: Server-Authoritative Shuffle and Match

**What:** The client never has access to the full list of card-icon mappings. When a card is clicked, the client sends a `flipCard` event to the server. The server verifies it's that player's turn, processes the flip, evaluates match states, and broadcasts updates back to both players.

**Why:** Prevents users from inspecting client-side state/DOM variables to see card answers before clicking them.

**Example:**
```typescript
// Server-side flip validation (simplified)
socket.on('flipCard', ({ roomId, cardIndex }) => {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return;
  if (room.currentTurn !== socket.id) return; // not your turn
  if (room.flippedCards.length >= 2) return; // wait for flip back animation
  
  // Update state, push flip
  room.flippedCards.push(cardIndex);
  io.to(roomId).emit('cardFlipped', { cardIndex, icon: room.board[cardIndex].icon });

  if (room.flippedCards.length === 2) {
    checkMatch(room);
  }
});
```

### Pattern 2: Optimistic Connection / Recovery Cache

**What:** If a player experiences connection failure, the client attempts auto-reconnection. The server keeps the room memory alive for 30 seconds before declaring the other player winner.

**Why:** Sockets drop frequently on mobile devices or poor Wi-Fi. A brief grace period maintains a premium UX.

## Data Flow

### Real-Time Update Flow

```
[Player Click Card] 
       │ 
       ▼ (Sends socket.emit('flip-card', { cardIndex }))
[Socket.IO Server] ────► [Validates Turn & Flipped Cards Count]
       │
       ├─► [Update Server-side Room State]
       │
       ▼ (Emits io.to(roomId).emit('state-updated', state))
[Both Clients] ────► [Zustand store receives update & updates local UI]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 Concurrent Rooms | Standard in-memory Map (`rooms = new Map()`) on a single Node.js instance. |
| 100-1000 Concurrent Rooms | Introduce Redis adapter to Socket.IO. Allows clustering Node.js servers across Railway replicas. |

## Anti-Patterns

### Client-Side Shuffle

**What people do:** The client generates card values and sends the board structure to the server.
**Why it's wrong:** Simple browser devtools intercepts allow the player to look at the post-shuffled array in RAM.
**Do this instead:** Server shuffles on game initialization and returns an array of placeholder card elements (containing only unique IDs, not icons).

## Sources

- Next.js 15 Deployment Guide
- Socket.IO Multi-node Scale Guides (Redis Adapter)

---
*Architecture research for: real-time multiplayer Memory Card Game*
*Researched: 2026-07-02*
