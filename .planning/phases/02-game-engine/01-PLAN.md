---
plan: 02-01
phase: 2
type: setup
wave: 1
depends_on: []
files_modified:
  - server/src/index.ts
  - server/src/roomManager.ts
  - server/src/gameEngine.ts
autonomous: true
requirements: [ROOM-07]
---

# Plan 02-01: Room creation, join, player session management, and in-memory room store

<objective>
Implement the server-side room lifecycle: clients can create rooms (receiving a unique 6-char code), join rooms by code, and the game auto-starts when 2 players have joined. Store all room state in-memory (Map). Assign each connecting client a session ID that persists across reconnects.
</objective>

<wave_info>
wave: 1
parallel_with: []
</wave_info>

---

## Tasks

### Task 2-01-01: Create RoomManager class with in-memory store

**type:** execute

**<read_first>**
- `server/tsconfig.json` (module: NodeNext — use ESM-style imports)
- `src/types/index.ts` (existing Room, Player, Card, GameState interfaces)
- `server/src/index.ts` (current entry point with ping/pong handler)
</read_first>

**<action>**
1. Create `server/src/roomManager.ts` with the following content:

```typescript
import type { Room, Player, Card } from "../src/types/index.js";

interface RoomData {
  room: Room;
  evaluationLock: boolean;
}

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 6;

const rooms = new Map<string, RoomData>();

function generateCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function createRoom(): RoomData {
  let code: string;
  do {
    code = generateCode();
  } while (rooms.has(code));

  const room: Room = {
    id: code,
    players: [],
    spectators: [],
    status: "waiting",
    board: [],
    currentTurn: null,
    flippedCards: [],
    createdAt: Date.now(),
  };

  const data: RoomData = { room, evaluationLock: false };
  rooms.set(code, data);
  return data;
}

function getRoom(code: string): RoomData | undefined {
  return rooms.get(code.toUpperCase());
}

function addPlayer(code: string, socketId: string, name: string, playerId: string): Player | null {
  const data = rooms.get(code.toUpperCase());
  if (!data) return null;
  if (data.room.players.length >= 2) return null;

  const player: Player = {
    id: playerId,
    name,
    score: 0,
    moves: 0,
    isConnected: true,
  };

  data.room.players.push(player);
  return player;
}

function removePlayer(code: string, playerId: string): boolean {
  const data = rooms.get(code.toUpperCase());
  if (!data) return false;
  data.room.players = data.room.players.filter((p) => p.id !== playerId);
  if (data.room.players.length === 0) {
    rooms.delete(code.toUpperCase());
  }
  return true;
}

function deleteRoom(code: string): void {
  rooms.delete(code.toUpperCase());
}

function getRoomCount(): number {
  return rooms.size;
}

export {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  deleteRoom,
  getRoomCount,
  type RoomData,
};
```

2. Verify the file compiles:
```powershell
npx tsc --noEmit --project server/tsconfig.json
```
Must exit with code 0.
</action>

**<acceptance_criteria>**
- `server/src/roomManager.ts` exists
- File exports `createRoom`, `getRoom`, `addPlayer`, `removePlayer`, `deleteRoom`, `getRoomCount`, `RoomData`
- `npx tsc --noEmit --project server/tsconfig.json` exits 0
- Room code generation produces 6-char alphanumeric codes (excluding ambiguous chars)

---

### Task 2-01-02: Create gameEngine.ts with game initialization

**type:** execute

**<read_first>**
- `src/types/index.ts` (Card interface)
- `server/src/roomManager.ts` (RoomData structure)
- `.planning/research/ARCHITECTURE.md` (server-authoritative shuffle pattern)
</read_first>

**<action>**
1. Create `server/src/gameEngine.ts` with the following content:

```typescript
import type { Card, Room } from "../src/types/index.js";

const CARD_ICONS = [
  "nextjs", "react", "typescript", "tailwind",
  "nodejs", "socketio", "zustand", "framer",
  "git", "vscode", "docker", "vercel",
];

let nextCardId = 1;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateBoard(): Card[] {
  const pairs = shuffleArray(CARD_ICONS).slice(0, 12);
  const cards: Card[] = [];

  for (let i = 0; i < pairs.length; i++) {
    for (let copy = 0; copy < 2; copy++) {
      cards.push({
        id: nextCardId++,
        icon: pairs[i],
        isFlipped: false,
        isMatched: false,
      });
    }
  }

  return shuffleArray(cards);
}

function initGame(room: Room): void {
  room.board = generateBoard();
  room.status = "playing";
  room.currentTurn = room.players[0]?.id ?? null;
  room.flippedCards = [];
  room.players.forEach((p) => {
    p.score = 0;
    p.moves = 0;
  });
}

function resetForRematch(room: Room): void {
  room.board = [];
  room.status = "waiting";
  room.currentTurn = null;
  room.flippedCards = [];
  nextCardId = 1;
}

export { generateBoard, initGame, resetForRematch, CARD_ICONS };
```

2. Verify the file compiles:
```powershell
npx tsc --noEmit --project server/tsconfig.json
```
Must exit with code 0.
</action>

**<acceptance_criteria>**
- `server/src/gameEngine.ts` exists
- `generateBoard()` returns 24 cards (12 unique icons × 2 copies each)
- `initGame()` sets `room.status` to `"playing"`, resets all player scores/moves, assigns `currentTurn`
- `npx tsc --noEmit --project server/tsconfig.json` exits 0

---

### Task 2-01-03: Implement Socket.IO event handlers for room management

**type:** execute

**<read_first>**
- `server/src/index.ts` (current server entry — will extend)
- `server/src/roomManager.ts` (room CRUD functions)
- `server/src/gameEngine.ts` (game init)
- `src/types/index.ts` (Room, Player types)
</read_first>

**<action>**
1. Rewrite `server/src/index.ts` to import roomManager and gameEngine, and add room event handlers:

```typescript
import { createServer } from "http";
import { Server } from "socket.io";
import {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  deleteRoom,
} from "./roomManager.js";
import { initGame } from "./gameEngine.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[server] Client connected: ${socket.id}`);

  socket.on("ping", (cb) => {
    if (typeof cb === "function") cb("pong");
  });

  socket.on("createRoom", ({ name }: { name: string }, callback) => {
    const data = createRoom();
    const playerId = socket.id;
    const player = addPlayer(data.room.id, socket.id, name, playerId);
    if (!player) {
      callback({ error: "Failed to join room" });
      return;
    }
    socket.join(data.room.id);
    socket.data.playerId = playerId;
    socket.data.roomId = data.room.id;

    callback({
      roomId: data.room.id,
      playerId,
      players: data.room.players,
    });

    io.to(data.room.id).emit("roomUpdate", {
      players: data.room.players,
      status: data.room.status,
    });
  });

  socket.on("joinRoom", ({ code, name }: { code: string; name: string }, callback) => {
    const data = getRoom(code);
    if (!data) {
      callback({ error: "Room not found" });
      return;
    }
    if (data.room.players.length >= 2) {
      callback({ error: "Room is full" });
      return;
    }

    const playerId = socket.id;
    const player = addPlayer(data.room.id, socket.id, name, playerId);
    if (!player) {
      callback({ error: "Failed to join room" });
      return;
    }

    socket.join(data.room.id);
    socket.data.playerId = playerId;
    socket.data.roomId = data.room.id;

    callback({
      roomId: data.room.id,
      playerId,
      players: data.room.players,
    });

    if (data.room.players.length === 2) {
      initGame(data.room);
      io.to(data.room.id).emit("gameStart", {
        board: data.room.board.map((c) => ({ id: c.id, isFlipped: c.isFlipped, isMatched: c.isMatched })),
        players: data.room.players,
        currentTurn: data.room.currentTurn,
      });
    } else {
      io.to(data.room.id).emit("roomUpdate", {
        players: data.room.players,
        status: data.room.status,
      });
    }
  });

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
          players: data.room.players,
          status: data.room.status,
        });
      }
    }
  });
});

httpServer
  .listen(PORT, () => {
    console.log(`[server] Socket.IO server listening on port ${PORT}`);
  })
  .on("error", (err) => {
    console.error(`[server] Failed to listen on port ${PORT}:`, err.message);
    process.exit(1);
  });
```

2. Verify the server compiles and starts:
```powershell
npx tsc --noEmit --project server/tsconfig.json
```
Must exit with code 0.
</action>

**<acceptance_criteria>**
- `io.on("connection", ...)` handles `createRoom`, `joinRoom`, `disconnect` events
- `createRoom` creates a room, adds the creator as player 1, returns roomId + playerId
- `joinRoom` by code adds second player, emits `gameStart` when 2 players present
- `gameStart` emits board without icons (only id/isFlipped/isMatched)
- `disconnect` marks player as disconnected and emits `roomUpdate`
- `npx tsc --noEmit --project server/tsconfig.json` exits 0

---

## <threat_model>

**Phase 2 — Game Engine (server-side)**

- Room codes are generated with `Math.random()` — acceptable for casual play; cryptographically secure codes are unnecessary for a non-monetized game.
- Card icons are never sent to the client until flipped — the board sent on `gameStart` only contains `{ id, isFlipped, isMatched }`, not icons. This prevents client-side cheating.
- No user input validated beyond basic presence checks — SQL injection is impossible (no database). XSS is mitigated because display names are only shown in the game UI (not rendered as HTML).
- In-memory room store means server restart loses all rooms — acceptable for MVP.
- **Risk:** Low. No authentication, no persistence, no sensitive data.

</threat_model>

---

## <verification>

1. **Type check:** `npx tsc --noEmit --project server/tsconfig.json` exits 0
2. **Server starts:** `npm run dev --prefix server` starts without crash
3. **Room creation test:** Socket.IO client emits `createRoom` → receives `roomId` and `playerId`
4. **Room join test:** Second client emits `joinRoom` with code → receives `gameStart` event
5. **Room full rejection:** Third client emits `joinRoom` with same code → receives `{ error: "Room is full" }`
6. **Disconnect handling:** Client disconnects → remaining player receives `roomUpdate` with `isConnected: false`

</verification>

## <success_criteria>

- [ ] Two Socket.IO clients can create and join a room; game auto-starts when 2 players joined
- [ ] `gameStart` event contains board cards with `id`, `isFlipped`, `isMatched` but NOT `icon`
- [ ] Third client attempting to join a full room receives error
- [ ] Disconnecting marks player as disconnected and notifies the room
- [ ] Server compiles and runs without errors

</success_criteria>
