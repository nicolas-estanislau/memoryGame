# Phase 3: Game UI & Sync — Research

## Server Events (Consumed by Client)

| Event | Payload | When |
|-------|---------|------|
| `gameStart` | `{ board: Card[] (id/isFlipped/isMatched only), players, currentTurn }` | 2nd player joins |
| `cardFlipped` | `{ cardId, icon, playerId }` | Card flip approved |
| `cardMatched` | `{ cardIds: [id1,id2], playerId, score, players }` | Pair matched |
| `mismatchResolved` | `{ cardIds, currentTurn, players }` | 1s after mismatch |
| `gameOver` | `{ winner, players, elapsedTime }` | All pairs matched |
| `timerTick` | `{ elapsedTime }` | Every 1s during play |
| `roomUpdate` | `{ players, status }` | Room state change |
| `rematchVote` | `{ playerId, votes }` | Player requests rematch |

## Client Emits

| Event | Payload | 
|-------|---------|
| `createRoom` | `{ name }` |
| `joinRoom` | `{ code, name }` |
| `flipCard` | `{ cardId }` |
| `requestRematch` | `{}` |
| `leaveRoom` | `{}` |

## Shared Types

- `Card`: id, icon, isFlipped, isMatched
- `Player`: id, name, score, moves, isConnected
- `Room`: id, players, status, board, currentTurn, flippedCards, createdAt, rematchVotes?, elapsedTime?
- `GameState`: roomId, board, players, currentTurn, status, winner, elapsedTime

## Current Client State

- **Socket**: Singleton in `src/hooks/useSocket.ts` (autoConnect: false)
- **Zustand store**: Minimal — `socketConnected` only
- **UI primitives**: shadcn Button, Card, Dialog, Skeleton, sonner toast
- **No game components**: Board, CardTile, Scoreboard, Timer, WinnerModal all need creation
- **No game route**: `src/app/game/[roomId]/` must be created

## Dependencies to Install

- `framer-motion` — 3D card flip animations, page/component transitions
- `canvas-confetti` + `@types/canvas-confetti` — victory confetti burst

## Key Architecture Decisions

1. **Game state in Zustand store** — single source of truth synced to server events
2. **`gameStart` fires before route navigation** — player joins room, gets `gameStart` event, then navigates to `/game/[roomId]`
3. **No icons in `gameStart` board** — icons arrive per-card via `cardFlipped` event after successful flip
4. **Board lock state** — local `isBoardLocked` flag prevents clicking during: (a) 2 cards showing, (b) not player's turn, (c) evaluation delay
5. **Card component** — receives `isFlipped`, `isMatched` via props; animation driven by Framer Motion `rotateY`
6. **Server is source of truth** — all score, turn, timer, match state comes from server events
