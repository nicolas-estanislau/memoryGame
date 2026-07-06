---
plan: 04-03
phase: 4
type: feature
wave: 3
depends_on: [04-02]
files_modified:
  - src/app/game/[roomId]/page.tsx
  - src/components/WaitingRoom.tsx
  - src/components/LeaveDialog.tsx
autonomous: true
requirements: [ROOM-04, ROOM-05, ROOM-06, END-03]
---

# Plan 04-03: Waiting Room, Room Code Copy/Share, and Leave Dialog

**Objective:** When game page loads with status="waiting", show Waiting Room UI with room code display, copy button (clipboard + toast), share button (Web Share API), and leave dialog. Add Leave Room confirmation dialog.

## Tasks

### Task 4-03-01: Create WaitingRoom component

Create `src/components/WaitingRoom.tsx`:
- Shows room code in large monospace font
- "Copy Code" button: copies room code to clipboard via `navigator.clipboard.writeText`, shows success toast
- "Share" button: uses Web Share API (`navigator.share`) if available, otherwise copy fallback
- Waiting indicator: "Waiting for opponent..." with animated dots or spinner
- Leave button that triggers leave dialog

### Task 4-03-02: Create LeaveDialog component

Create `src/components/LeaveDialog.tsx` with shadcn Dialog:
- Title: "Leave Room?"
- Description: "Are you sure you want to leave? This will end the game."
- Cancel and Leave buttons
- Leave emits `leaveRoom` and navigates to `/`

### Task 4-03-03: Update game page with Waiting Room + leave logic

Modify `src/app/game/[roomId]/page.tsx`:
- When status === "waiting", show WaitingRoom instead of GameBoard
- Wire leave dialog into game page
- Skip joinRoom if myPlayerId already set (for lobby-originated navigation)
