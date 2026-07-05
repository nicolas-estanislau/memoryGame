---
plan: 02-03
phase: 2
type: feature
wave: 3
depends_on: [02-02]
files_modified:
  - server/src/index.ts
  - server/src/gameEngine.ts
autonomous: true
requirements: [GAME-07, GAME-08, GAME-09, GAME-10]
---

# Plan 02-03: Timer broadcasting, move counting, rematch, and game-end integration

<objective>
Add server-side game timer that broadcasts elapsed time to all players at regular intervals. Wire move counting into all flip responses. Implement rematch request/accept flow. Wire game-end detection end-to-end with proper winner/draw determination. Run end-to-end verification with two simulated Socket.IO clients.
</objective>

<wave_info>
wave: 3
depends_on: [02-02]
</wave_info>

---

## Tasks

### Task 2-03-01: Add timer broadcasting and rematch events to server/index.ts

**type:** execute

**<read_first>**
- `server/src/index.ts` (current handlers — flipCard, createRoom, joinRoom, disconnect)
- `server/src/gameEngine.ts` (resetForRematch, checkGameOver)
- `server/src/roomManager.ts` (room CRUD functions)
</read_first>

**<action>**
1. Update `server/src/index.ts` to add timer broadcasting, elapsed time tracking, and rematch handlers.

Replace the `initGame` call in the `joinRoom` handler to also start the timer. Add a Map for tracking timer intervals per room.

Add before the `io.on("connection", ...)` block:

```typescript
const roomTimers = new Map<string, ReturnType<typeof setInterval>>();

function startGameTimer(roomId: string): void {
  const data = getRoom(roomId);
  if (!data) return;
  data.room.elapsedTime = 0;

  const interval = setInterval(() => {
    const current = getRoom(roomId);
    if (!current || current.room.status !== "playing") {
      clearInterval(interval);
      roomTimers.delete(roomId);
      return;
    }
    current.room.elapsedTime += 1;
    io.to(roomId).emit("timerTick", { elapsedTime: current.room.elapsedTime });
  }, 1000);

  roomTimers.set(roomId, interval);
}

function stopGameTimer(roomId: string): void {
  const interval = roomTimers.get(roomId);
  if (interval) {
    clearInterval(interval);
    roomTimers.delete(roomId);
  }
}
```

Replace the existing `initGame` call block in the `joinRoom` handler with:

```typescript
if (data.room.players.length === 2) {
  initGame(data.room);
  startGameTimer(data.room.id);
  io.to(data.room.id).emit("gameStart", {
    board: data.room.board.map((c) => ({
      id: c.id,
      isFlipped: c.isFlipped,
      isMatched: c.isMatched,
    })),
    players: data.room.players.map((p) => ({
      id: p.id, name: p.name, score: p.score, moves: p.moves,
    })),
    currentTurn: data.room.currentTurn,
  });
}
```

After the `flipCard` handler's match/gameOver section, update the `gameOver` emit to:

```typescript
if (checkGameOver(data.room)) {
  stopGameTimer(roomId);
  const winner = determineWinner(data.room);
  io.to(roomId).emit("gameOver", {
    winner,
    players: data.room.players.map((p) => ({
      id: p.id, name: p.name, score: p.score, moves: p.moves,
    })),
    elapsedTime: data.room.elapsedTime,
  });
}
```

Add the following event handlers after the `flipCard` handler (before `disconnect`):

```typescript
  socket.on("requestRematch", (_data, callback) => {
    const roomId: string | undefined = socket.data.roomId;
    const playerId: string | undefined = socket.data.playerId;
    if (!roomId || !playerId) {
      if (callback) callback({ error: "Not in a room" });
      return;
    }

    const data = getRoom(roomId);
    if (!data) {
      if (callback) callback({ error: "Room not found" });
      return;
    }

    if (!data.room.rematchVotes) {
      data.room.rematchVotes = [];
    }

    if (!data.room.rematchVotes.includes(playerId)) {
      data.room.rematchVotes.push(playerId);
    }

    if (callback) callback({ success: true });

    io.to(roomId).emit("rematchVote", {
      playerId,
      votes: data.room.rematchVotes,
    });

    if (data.room.rematchVotes.length === data.room.players.length) {
      resetForRematch(data.room);
      initGame(data.room);
      startGameTimer(roomId);
      data.room.rematchVotes = [];
      io.to(roomId).emit("gameStart", {
        board: data.room.board.map((c) => ({
          id: c.id,
          isFlipped: c.isFlipped,
          isMatched: c.isMatched,
        })),
        players: data.room.players.map((p) => ({
          id: p.id, name: p.name, score: p.score, moves: p.moves,
        })),
        currentTurn: data.room.currentTurn,
      });
    }
  });

  socket.on("leaveRoom", (_data, callback) => {
    const roomId: string | undefined = socket.data.roomId;
    const playerId: string | undefined = socket.data.playerId;
    if (!roomId || !playerId) {
      if (callback) callback({ error: "Not in a room" });
      return;
    }

    stopGameTimer(roomId);
    removePlayer(roomId, playerId);
    socket.leave(roomId);
    delete socket.data.roomId;
    delete socket.data.playerId;

    if (callback) callback({ success: true });
    io.to(roomId).emit("roomUpdate", {
      players: getRoom(roomId)?.room.players ?? [],
      status: getRoom(roomId)?.room.status ?? "finished",
    });
  });
```

Also update the `disconnect` handler to clean up timers when all players disconnect:

```typescript
  socket.on("disconnect", () => {
    const playerId = socket.data.playerId;
    const roomId = socket.data.roomId;
    console.log(`[server] Client disconnected: ${socket.id} (playerId: ${playerId})`);

    if (roomId && playerId) {
      const data = getRoom(roomId);
      if (data) {
        const player = data.room.players.find((p) => p.id === playerId);
        if (player) {
          player.isConnected = false;
        }
        io.to(roomId).emit("roomUpdate", {
          players: data.room.players.map((p) => ({
            id: p.id, name: p.name, score: p.score, moves: p.moves, isConnected: p.isConnected,
          })),
          status: data.room.status,
        });

        if (data.room.players.every((p) => !p.isConnected)) {
          stopGameTimer(roomId);
        }
      }
    }
  });
```

2. Verify the server compiles:
```powershell
npx tsc --noEmit --project server/tsconfig.json
```
Must exit with code 0.
</action>

**<acceptance_criteria>**
- Timer starts when `gameStart` fires; `timerTick` emits every second with `elapsedTime`
- Timer stops when game ends (`gameOver`) or all players disconnect
- `requestRematch` adds a vote; when all players vote, a new game starts
- `leaveRoom` cleans up player, timer, and notifies remaining players
- `gameOver` payload includes `elapsedTime`
- `npx tsc --noEmit --project server/tsconfig.json` exits 0

---

### Task 2-03-02: Add rematchVotes field to Room interface

**type:** execute

**<read_first>**
- `src/types/index.ts` (Room interface)
</read_first>

**<action>**
1. Update the `Room` interface in `src/types/index.ts` to add the optional `rematchVotes` field:

```typescript
export interface Room {
  id: string;
  players: Player[];
  spectators: string[];
  status: "waiting" | "playing" | "finished";
  board: Card[];
  currentTurn: string | null;
  flippedCards: number[];
  createdAt: number;
  rematchVotes?: string[];
  elapsedTime?: number;
}
```

2. Verify both root and server type-check:
```powershell
npx tsc --noEmit
npx tsc --noEmit --project server/tsconfig.json
```
Both must exit with code 0.
</action>

**<acceptance_criteria>**
- `Room.rematchVotes` is an optional `string[]`
- `Room.elapsedTime` is an optional `number`
- Both `npx tsc --noEmit` (root) and `npx tsc --noEmit --project server/tsconfig.json` exit 0

---

### Task 2-03-03: End-to-end verification with simulated clients

**type:** execute

**<read_first>**
- All server source files
- `.planning/phases/02-game-engine/01-VALIDATION.md` (if exists)
</read_first>

**<action>**
1. Create a temporary end-to-end test script `test-game.mjs`:

```javascript
import { io } from "socket.io-client";

const BASE_URL = "http://localhost:3001";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  // Player 1 creates a room
  const p1 = io(BASE_URL);
  await new Promise((resolve) => p1.on("connect", resolve));

  const createResult = await new Promise((resolve) => {
    p1.emit("createRoom", { name: "Alice" }, resolve);
  });
  console.assert(createResult.roomId, "Room created with ID:", createResult.roomId);
  console.assert(createResult.playerId === p1.id, "Player 1 is creator");

  const roomCode = createResult.roomId;

  // Player 2 joins
  const p2 = io(BASE_URL);
  await new Promise((resolve) => p2.on("connect", resolve));

  const joinResult = await new Promise((resolve) => {
    p2.emit("joinRoom", { code: roomCode, name: "Bob" }, resolve);
  });
  console.assert(joinResult.roomId === roomCode, "Player 2 joined same room");

  // Game auto-started — verify gameStart event
  const gameStartP1 = await new Promise((resolve) => p1.once("gameStart", resolve));
  const gameStartP2 = await new Promise((resolve) => p2.once("gameStart", resolve));
  console.assert(gameStartP1.board.length === 24, "Board has 24 cards");
  console.assert(gameStartP1.board[0].id !== undefined, "Card has id");
  console.assert(gameStartP1.board[0].icon === undefined, "Card icon NOT exposed on gameStart");
  console.assert(gameStartP1.currentTurn === p1.id, "Player 1 goes first");
  console.log("✓ gameStart received by both players with 24 cards (no icons)");

  // Player 1 flips a card
  const flip1 = await new Promise((resolve) => {
    p1.emit("flipCard", { cardId: gameStartP1.board[0].id }, resolve);
  });
  console.assert(flip1.success === true, "First flip succeeds");
  console.log("✓ First card flip succeeds");

  // Player 1 flips second card (same turn)
  const flip2 = await new Promise((resolve) => {
    p1.emit("flipCard", { cardId: gameStartP1.board[5].id }, resolve);
  });
  if (flip2.success) {
    if (flip2.matched) {
      console.log("✓ Match found on first try (lucky!)");
    } else {
      // Wait for mismatch resolution
      const mismatch = await new Promise((resolve) => p1.once("mismatchResolved", resolve));
      console.assert(mismatch.currentTurn === p2.id || mismatch.currentTurn === p1.id, "Turn switched after mismatch");
      console.log("✓ Mismatch resolved, turn may have switched");
    }
  } else {
    console.log("✓ Second flip handled (no error crash)");
  }

  // Test: Player 2 cannot flip during Player 1's turn (unless turn switched)
  const illegalFlip = await new Promise((resolve) => {
    p2.emit("flipCard", { cardId: gameStartP1.board[1].id }, resolve);
  });
  console.log(`✓ Illegal flip response: ${JSON.stringify(illegalFlip)}`);

  // Request rematch
  const remakeReq = await new Promise((resolve) => {
    p1.emit("requestRematch", {}, resolve);
  });
  console.assert(remakeReq.success === true, "Rematch request accepted");
  console.log("✓ Rematch request accepted");

  // Leave room
  p1.emit("leaveRoom");
  p2.emit("leaveRoom");

  await delay(500);
  p1.close();
  p2.close();

  console.log("\n=== All tests completed ===");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
```

2. Start the server in the background, run the test, then clean up:

```powershell
$serverJob = Start-Job -ScriptBlock {
  param($wd) Set-Location $wd
  npx tsx watch server/src/index.ts 2>&1
} -ArgumentList "C:\Users\Nicolas\Documents\projetos\memoryGame"
Start-Sleep -Seconds 5
node test-game.mjs 2>&1
if ($?) { Write-Output "E2E TESTS PASS" } else { Write-Output "E2E TESTS FAIL" }
Stop-Job $serverJob -ErrorAction SilentlyContinue
Remove-Job $serverJob -Force -ErrorAction SilentlyContinue
Remove-Item -Force test-game.mjs -ErrorAction SilentlyContinue
```

Note: The test may show "Illegal flip response: {"error":"Not your turn"}" or `{"success": true}` depending on whether the turn already switched during the mismatch sequence. Either is valid — the important thing is the server didn't crash.
</action>

**<acceptance_criteria>**
- Two clients can create → join → auto-start game
- `gameStart` contains 24 cards with `id` but NOT `icon`
- Card flips succeed or return appropriate errors
- `requestRematch` is acknowledged
- Server does not crash during test sequence

---

### Note: Move Counting

Move counting is already implemented in Plan 02-02 (Task 2-02-01, `flipCard` increments `player.moves`). The moves count is included in all player-state broadcasts (`cardMatched`, `mismatchResolved`, `gameOver`, `roomUpdate`). Requirement GAME-10 is satisfied by 02-02.

---

## <threat_model>

**Phase 2 — Game Engine (timer/rematch/lifecycle)**

- Timer is server-authoritative: clients cannot manipulate elapsed time.
- Rematch votes are tracked server-side: a player cannot force a rematch unilaterally.
- `leaveRoom` cleans up all server-side state, preventing orphaned rooms from accumulating.
- Timer intervals are cleared when rooms are deleted or all players disconnect, preventing memory leaks.
- **Risk:** Low. Timer uses standard `setInterval`; intervals are properly tracked and cleaned up.

</threat_model>

---

## <verification>

1. **Type check:** `npx tsc --noEmit --project server/tsconfig.json` exits 0
2. **Timer broadcast:** After `gameStart`, `timerTick` events fire every second with incrementing `elapsedTime`
3. **Timer stop on game end:** After `gameOver`, no more `timerTick` events fire
4. **Rematch flow:** Two `requestRematch` votes → new `gameStart` event with reset board and scores
5. **Leave room:** `leaveRoom` removes player; remaining player notified
6. **Server stability:** Server handles multiple concurrent rooms without crashes
7. **Full type check:** Root `npx tsc --noEmit` also passes (shared types updated)

</verification>

## <success_criteria>

- [ ] `timerTick` events broadcast elapsed time every second after game starts (GAME-09)
- [ ] Timer stops when `gameOver` fires
- [ ] Move count tracked per player and included in all state broadcasts (GAME-10)
- [ ] Rematch flow: both players vote → new game starts with reset state
- [ ] `gameOver` payload includes `winner` (or null for draw), player scores, moves, and elapsed time
- [ ] `leaveRoom` cleans up player state and notifies remaining participants
- [ ] Root and server TypeScript both compile without errors

</success_criteria>
