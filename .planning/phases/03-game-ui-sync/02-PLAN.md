---
plan: 03-02
phase: 3
type: feature
wave: 2
depends_on: [03-01]
files_modified:
  - src/store/gameStore.ts
  - src/hooks/useSocket.ts
  - src/components/Scoreboard.tsx
  - src/components/Timer.tsx
  - src/app/layout.tsx
autonomous: true
requirements: [SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, BOARD-05, BOARD-06]
---

# Plan 03-02: Socket.IO Real-Time Sync, Scoreboard, Turn Indicator, and Timer

<objective>
Wire all Socket.IO server events to a Zustand game store on the client. Build the scoreboard (player names, scores, moves), turn indicator ("Your Turn" / "Opponent's Turn"), and timer (M:SS format synced to server ticks). All game state flows server → socket → store → React components.
</objective>

<wave_info>
wave: 2
depends_on: [03-01]
</wave_info>

---

## Tasks

### Task 3-02-01: Create Zustand game store synced to Socket.IO events

**type:** execute

**<read_first>**
- `src/store/index.ts` (existing minimal store — pattern for Zustand create)
- `src/hooks/useSocket.ts` (singleton socket getter)
- `src/types/index.ts` (Card, Player, Room, GameState)
- `server/src/index.ts` (server events: gameStart, cardFlipped, cardMatched, mismatchResolved, timerTick, gameOver, roomUpdate, rematchVote)
- `03-RESEARCH.md` (Event payload tables)

**<action>**
Create `src/store/gameStore.ts`:

```typescript
import { create } from "zustand";
import type { Card, Player } from "@/types";

interface GameState {
  roomId: string | null;
  board: Card[];
  players: Player[];
  currentTurn: string | null;
  status: "waiting" | "playing" | "finished";
  winner: { id: string; name: string } | null;
  elapsedTime: number;
  isBoardLocked: boolean;
  myPlayerId: string | null;
  myName: string | null;
}

interface GameActions {
  setRoomId: (id: string) => void;
  setMyPlayer: (id: string, name: string) => void;
  setGameStart: (board: Card[], players: Player[], currentTurn: string) => void;
  setCardFlipped: (cardId: number, icon: string) => void;
  setCardMatched: (cardIds: number[], playerId: string, score: number, players: Player[]) => void;
  setMismatchResolved: (cardIds: number[], currentTurn: string, players: Player[]) => void;
  setTimerTick: (elapsedTime: number) => void;
  setGameOver: (winner: { id: string; name: string } | null, players: Player[], elapsedTime: number) => void;
  setRoomUpdate: (players: Player[], status: string) => void;
  setBoardLocked: (locked: boolean) => void;
  reset: () => void;
}

const initialState: GameState = {
  roomId: null,
  board: [],
  players: [],
  currentTurn: null,
  status: "waiting",
  winner: null,
  elapsedTime: 0,
  isBoardLocked: false,
  myPlayerId: null,
  myName: null,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setRoomId: (id) => set({ roomId: id }),

  setMyPlayer: (id, name) => set({ myPlayerId: id, myName: name }),

  setGameStart: (board, players, currentTurn) =>
    set({
      board: board.map((c) => ({ ...c, icon: "" })),
      players,
      currentTurn,
      status: "playing",
      elapsedTime: 0,
      isBoardLocked: false,
    }),

  setCardFlipped: (cardId, icon) =>
    set((state) => ({
      board: state.board.map((c) => (c.id === cardId ? { ...c, isFlipped: true, icon } : c)),
    })),

  setCardMatched: (cardIds, _playerId, _score, players) =>
    set((state) => ({
      board: state.board.map((c) =>
        cardIds.includes(c.id) ? { ...c, isMatched: true, isFlipped: true } : c,
      ),
      players,
      isBoardLocked: false,
    })),

  setMismatchResolved: (cardIds, currentTurn, players) =>
    set((state) => ({
      board: state.board.map((c) =>
        cardIds.includes(c.id) ? { ...c, isFlipped: false } : c,
      ),
      currentTurn,
      players,
      isBoardLocked: false,
    })),

  setTimerTick: (elapsedTime) => set({ elapsedTime }),

  setGameOver: (winner, players, elapsedTime) =>
    set({
      winner,
      players,
      elapsedTime,
      status: "finished",
      isBoardLocked: true,
    }),

  setRoomUpdate: (players, status) =>
    set({ players, status: status as GameState["status"] }),

  setBoardLocked: (locked) => set({ isBoardLocked: locked }),

  reset: () => set(initialState),
}));
```

**<acceptance_criteria>**
- `src/store/gameStore.ts` exists with all 12 actions defined
- `setGameStart` initializes board with empty icon strings (icons arrive per-flip)
- `setCardFlipped` updates single card with icon, sets isFlipped=true
- `setCardMatched` sets isMatched=true on both cards, updates players, unlocks board
- `setMismatchResolved` flips cards back (isFlipped=false), sets currentTurn, unlocks board
- `setGameOver` locks board, sets status=finished, stores winner
- `setTimerTick` updates elapsedTime
- `reset` restores initial state
- `npx tsc --noEmit` exits 0

---

### Task 3-02-02: Wire Socket.IO event listeners to game store

**type:** execute

**<read_first>**
- `src/hooks/useSocket.ts` (existing getSocket function)
- `src/store/gameStore.ts` (game store actions)
- `src/store/index.ts` (app store — socketConnected flag)
- `server/src/index.ts` (server emit payloads — verify field names match store actions)

**<action>**
Create `src/hooks/useGameSocket.ts`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/store/gameStore";
import { useAppStore } from "@/store";

export function useGameSocket() {
  const initialized = useRef(false);
  const {
    setGameStart,
    setCardFlipped,
    setCardMatched,
    setMismatchResolved,
    setTimerTick,
    setGameOver,
    setRoomUpdate,
    setBoardLocked,
  } = useGameStore();
  const setSocketConnected = useAppStore((s) => s.setSocketConnected);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket();
    if (!socket) return;

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("gameStart", ({ board, players, currentTurn }) => {
      setGameStart(board, players, currentTurn);
    });

    socket.on("cardFlipped", ({ cardId, icon }) => {
      setCardFlipped(cardId, icon);
    });

    socket.on("cardMatched", ({ cardIds, playerId, score, players }) => {
      setCardMatched(cardIds, playerId, score, players);
    });

    socket.on("mismatchResolved", ({ cardIds, currentTurn, players }) => {
      setMismatchResolved(cardIds, currentTurn, players);
    });

    socket.on("timerTick", ({ elapsedTime }) => {
      setTimerTick(elapsedTime);
    });

    socket.on("gameOver", ({ winner, players, elapsedTime }) => {
      setGameOver(winner, players, elapsedTime);
    });

    socket.on("roomUpdate", ({ players, status }) => {
      setRoomUpdate(players, status);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("gameStart");
      socket.off("cardFlipped");
      socket.off("cardMatched");
      socket.off("mismatchResolved");
      socket.off("timerTick");
      socket.off("gameOver");
      socket.off("roomUpdate");
    };
  }, [setGameStart, setCardFlipped, setCardMatched, setMismatchResolved,
      setTimerTick, setGameOver, setRoomUpdate, setBoardLocked, setSocketConnected]);
}

export function emitFlipCard(cardId: number) {
  const socket = getSocket();
  if (!socket) return;
  useGameStore.getState().setBoardLocked(true);
  socket.emit("flipCard", { cardId }, (res: { success?: boolean; error?: string }) => {
    if (res?.error) {
      useGameStore.getState().setBoardLocked(false);
    }
  });
}

export function emitRequestRematch() {
  getSocket()?.emit("requestRematch");
}

export function emitLeaveRoom() {
  getSocket()?.emit("leaveRoom");
}
```

**<acceptance_criteria>**
- `src/hooks/useGameSocket.ts` exists with `useGameSocket`, `emitFlipCard`, `emitRequestRematch`, `emitLeaveRoom` exports
- `useGameSocket` registers all 7 server event listeners in a single useEffect
- `emitFlipCard` sets isBoardLocked=true before emit, resets on error callback
- Cleanup function removes all listeners
- `npx tsc --noEmit` exits 0

---

### Task 3-02-03: Build Scoreboard with player names, scores, moves, and turn indicator

**type:** execute

**<read_first>**
- `src/store/gameStore.ts` (players array, currentTurn, myPlayerId)
- `src/types/index.ts` (Player interface)
- `03-UI-SPEC.md` (Scoreboard — horizontal bar, two slots, violet border on active)

**<action>**
Create `src/components/Scoreboard.tsx`:

```typescript
"use client";

import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Scoreboard() {
  const players = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const status = useGameStore((s) => s.status);

  if (players.length === 0) return null;

  return (
    <div className="flex items-center justify-between max-w-[480px] mx-auto px-4 py-3 gap-4">
      {players.map((player) => {
        const isActive = currentTurn === player.id;
        const isMe = player.id === myPlayerId;
        return (
          <div
            key={player.id}
            className={cn(
              "flex-1 rounded-lg border bg-card p-3 transition-colors",
              isActive && "border-l-4 border-l-violet-500",
            )}
          >
            <div className="text-sm font-medium">
              {isMe ? "You" : player.name}
              {isActive && <span className="ml-2 text-xs text-violet-500">● Your Turn</span>}
              {status === "playing" && !isActive && isMe && (
                <span className="ml-2 text-xs text-muted-foreground">○ Opponent&apos;s Turn</span>
              )}
            </div>
            <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
              <span>{player.score} pairs</span>
              <span>{player.moves} moves</span>
            </div>
          </div>
        );
      })}
      {status === "playing" && (
        <div className="text-sm font-mono text-muted-foreground whitespace-nowrap">
          {formatTime(elapsedTime)}
        </div>
      )}
    </div>
  );
}
```

**<acceptance_criteria>**
- `src/components/Scoreboard.tsx` exists and exports `Scoreboard`
- Shows each player's name, score (pairs), and moves
- Active player slot has violet left border (border-l-4 border-l-violet-500)
- "● Your Turn" indicator on active player slot
- "○ Opponent's Turn" when it's not my turn
- Timer displayed in M:SS format between/alongside player slots
- Returns null when players array is empty
- `npx tsc --noEmit` exits 0

---

## <threat_model>

**Phase 3 — Real-Time Sync**

- Server is the single source of truth for all game state; the Zustand store merely reflects server events
- Client-side board lock (`isBoardLocked`) is a UX guard only — server-side `evaluationLock` is the real security boundary
- Socket event listeners are cleaned up on component unmount to prevent memory leaks and duplicate handlers
- No sensitive data in socket payloads (card icons are pre-defined, player names are ephemeral)
- **Risk:** Low. All state mutations are driven by server events; client cannot inject or modify game state.

</threat_model>

---

## <verification>

1. **Store actions:** All 12 store actions update state as expected
2. **Socket wiring:** All 7 server event listeners registered; cleanup removes them
3. **FlipCard emit:** Sets board lock, emits, resets on error
4. **Scoreboard render:** Shows player data, active indicator, timer
5. **Type check:** `npx tsc --noEmit` exits 0
6. **Build:** `npm run build` exits 0

---

## <success_criteria>

- [ ] All flip events broadcast and rendered in real-time on both clients (SYNC-01)
- [ ] Score updates reflected immediately after match detection (SYNC-02)
- [ ] Turn indicator updates after every mismatch/turn switch (SYNC-03)
- [ ] Timer synced from server ticks, not client-side intervals (SYNC-04)
- [ ] Game-end state broadcast and received by all participants (SYNC-05)
- [ ] Turn indicator shows "Your Turn" / "Opponent's Turn" correctly (BOARD-05)
- [ ] Scoreboard shows name, score, and moves for each player (BOARD-06)
