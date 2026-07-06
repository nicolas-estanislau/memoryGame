---
plan: 04-02
phase: 4
type: feature
wave: 2
depends_on: [04-01]
files_modified:
  - src/app/create/page.tsx
  - src/app/join/page.tsx
autonomous: true
requirements: [ROOM-02, ROOM-03]
---

# Plan 04-02: Create Room and Join Room Pages

**Objective:** Build Create Room page (name input → create → navigate to game) and Join Room page (room code + name → join → navigate to game). Both connect the socket, emit the appropriate server event, and set store state before routing.

## Tasks

### Task 4-02-01: Create Room page

Create `src/app/create/page.tsx`:
- "use client" component
- Player name input (prefilled from sessionStorage)
- "Create Room" button
- On click: connect socket, emit `createRoom` with name
- On callback: store roomId + myPlayerId + myName in gameStore, then `router.push` to game page
- Loading state during creation

### Task 4-02-02: Join Room page

Create `src/app/join/page.tsx`:
- "use client" component
- Room code input + player name input
- "Join Room" button
- On click: connect socket, emit `joinRoom` with code + name
- On callback: if error (not found/full), show toast error; else store state + navigate to game
- Loading state during join
