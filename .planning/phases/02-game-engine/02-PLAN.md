---
plan: 02-02
phase: 2
type: feature
wave: 2
depends_on: [02-01]
files_modified:
  - server/src/gameEngine.ts
  - server/src/index.ts
autonomous: true
requirements: [GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06]
---

# Plan 02-02: Card shuffling, flip validation, match detection, scoring, and turn switching

<objective>
Implement the core game loop on the server: validate card flip events (turn check, duplicate flip check, evaluation lock), detect matches, increment scores, switch turns on mismatch after 1-second delay, and broadcast all state changes to room participants.
</objective>

<wave_info>
wave: 2
depends_on: [02-01]
</wave_info>

---

## Tasks

### Task 2-02-01: Add flip validation and match detection to gameEngine.ts

**type:** execute

**<read_first>**
- `server/src/gameEngine.ts` (current state — has `generateBoard`, `initGame`)
- `src/types/index.ts` (Room, Card interfaces)
- `server/src/roomManager.ts` (RoomData with `evaluationLock` field)
- `.planning/research/ARCHITECTURE.md` (Pattern 1: Server-Authoritative Shuffle and Match)
- `.planning/research/PITFALLS.md` (Pitfall 2: Rapid Double-Click Exploit)
</read_first>

**<action>**
1. Rewrite `server/src/gameEngine.ts` to add flip validation and match logic:

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

function canFlipCard(room: Room, cardId: number, playerId: string): string | null {
  if (room.status !== "playing") return "Game is not in progress";
  if (room.currentTurn !== playerId) return "Not your turn";
  if (room.flippedCards.length >= 2) return "Board is locked during evaluation";

  const card = room.board.find((c) => c.id === cardId);
  if (!card) return "Card not found";
  if (card.isFlipped) return "Card is already flipped";
  if (card.isMatched) return "Card is already matched";

  if (room.flippedCards.length === 1) {
    const firstCard = room.board.find((c) => c.id === room.flippedCards[0]);
    if (firstCard && card.icon === firstCard.icon) return null;
  }

  return null;
}

interface FlipResult {
  success: boolean;
  cardId: number;
  icon?: string;
  matched?: boolean;
  matchCardId?: number;
  switchTurn?: boolean;
  error?: string;
}

function flipCard(room: Room, cardId: number, playerId: string): FlipResult {
  const validationError = canFlipCard(room, cardId, playerId);
  if (validationError) {
    return { success: false, cardId, error: validationError };
  }

  const card = room.board.find((c) => c.id === cardId)!;
  card.isFlipped = true;
  room.flippedCards.push(cardId);

  const player = room.players.find((p) => p.id === playerId);
  if (player) player.moves += 1;

  if (room.flippedCards.length === 2) {
    const firstCard = room.board.find((c) => c.id === room.flippedCards[0])!;
    const secondCard = room.board.find((c) => c.id === room.flippedCards[1])!;

    if (firstCard.icon === secondCard.icon) {
      firstCard.isMatched = true;
      secondCard.isMatched = true;
      room.flippedCards = [];
      if (player) player.score += 1;

      return {
        success: true,
        cardId,
        icon: card.icon,
        matched: true,
        matchCardId: firstCard.id === cardId ? secondCard.id : firstCard.id,
      };
    }
  }

  return {
    success: true,
    cardId,
    icon: card.icon,
  };
}

function executeMismatch(room: Room): void {
  for (const cardId of room.flippedCards) {
    const card = room.board.find((c) => c.id === cardId);
    if (card) card.isFlipped = false;
  }
  room.flippedCards = [];

  const currentIndex = room.players.findIndex((p) => p.id === room.currentTurn);
  if (currentIndex !== -1) {
    const nextIndex = (currentIndex + 1) % room.players.length;
    room.currentTurn = room.players[nextIndex].id;
  }
}

function checkGameOver(room: Room): boolean {
  return room.board.length > 0 && room.board.every((c) => c.isMatched);
}

function resetForRematch(room: Room): void {
  room.board = [];
  room.status = "waiting";
  room.currentTurn = null;
  room.flippedCards = [];
  nextCardId = 1;
}

export {
  generateBoard,
  initGame,
  canFlipCard,
  flipCard,
  executeMismatch,
  checkGameOver,
  resetForRematch,
  CARD_ICONS,
  type FlipResult,
};
```

2. Verify the file compiles:
```powershell
npx tsc --noEmit --project server/tsconfig.json
```
Must exit with code 0.
</action>

**<acceptance_criteria>**
- `canFlipCard()` rejects flips when: not player's turn, card already flipped, card already matched, board locked during evaluation
- `flipCard()` flips a card and returns `{ success: true, cardId, icon }`
- `flipCard()` detects matches when a pair has the same icon → sets `isMatched = true` on both cards, increments score
- `flipCard()` does NOT auto-flip back on mismatch (that's handled by the caller with a timer)
- `executeMismatch()` flips both cards back, clears `flippedCards[]`, switches `currentTurn`
- `checkGameOver()` returns `true` when all cards are matched
- `npx tsc --noEmit --project server/tsconfig.json` exits 0

---

### Task 2-02-02: Wire flipCard handler into server/index.ts

**type:** execute

**<read_first>**
- `server/src/index.ts` (current event handlers)
- `server/src/gameEngine.ts` (new exports: `canFlipCard`, `flipCard`, `executeMismatch`, `checkGameOver`)
- `server/src/roomManager.ts` (RoomData with `evaluationLock`)
- `.planning/research/PITFALLS.md` (Pitfall 2: Rapid Double-Click Exploit)
</read_first>

**<action>**
1. Rewrite `server/src/index.ts` to add flip/mismatch handlers (preserving all existing room handlers from 02-01):

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
import {
  initGame,
  canFlipCard,
  flipCard,
  executeMismatch,
  checkGameOver,
} from "./gameEngine.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const MISMATCH_DELAY_MS = 1000;

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

  socket.on("flipCard", ({ cardId }: { cardId: number }, callback) => {
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

    if (data.evaluationLock) {
      if (callback) callback({ error: "Board is locked" });
      return;
    }

    const validationError = canFlipCard(data.room, cardId, playerId);
    if (validationError) {
      if (callback) callback({ error: validationError });
      return;
    }

    const result = flipCard(data.room, cardId, playerId);
    if (!result.success) {
      if (callback) callback({ error: result.error });
      return;
    }

    if (callback) callback({ success: true, cardId: result.cardId });

    io.to(roomId).emit("cardFlipped", {
      cardId: result.cardId,
      icon: result.icon,
      playerId,
    });

    if (result.matched && result.matchCardId) {
      io.to(roomId).emit("cardMatched", {
        cardIds: [result.cardId, result.matchCardId],
        playerId,
        score: data.room.players.find((p) => p.id === playerId)?.score,
        players: data.room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, moves: p.moves })),
      });

      if (checkGameOver(data.room)) {
        const winner = determineWinner(data.room);
        io.to(roomId).emit("gameOver", {
          winner,
          players: data.room.players.map((p) => ({
            id: p.id, name: p.name, score: p.score, moves: p.moves,
          })),
        });
      }
    }

    if (data.room.flippedCards.length === 2) {
      data.evaluationLock = true;
      setTimeout(() => {
        executeMismatch(data.room);
        data.evaluationLock = false;
        io.to(roomId).emit("mismatchResolved", {
          cardIds: [data.room.flippedCards[0], data.room.flippedCards[1]].filter(
            (id) => !data.room.board.find((c) => c.id === id)?.isMatched
          ),
          currentTurn: data.room.currentTurn,
          players: data.room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, moves: p.moves })),
        });
      }, MISMATCH_DELAY_MS);
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

function determineWinner(room: import("./roomManager.js").RoomData["room"]): { id: string; name: string } | null {
  const [p1, p2] = room.players;
  if (!p2) return null;
  if (p1.score > p2.score) return { id: p1.id, name: p1.name };
  if (p2.score > p1.score) return { id: p2.id, name: p2.name };
  return null;
}

httpServer
  .listen(PORT, () => {
    console.log(`[server] Socket.IO server listening on port ${PORT}`);
  })
  .on("error", (err) => {
    console.error(`[server] Failed to listen on port ${PORT}:`, err.message);
    process.exit(1);
  });
```

2. Verify the server compiles:
```powershell
npx tsc --noEmit --project server/tsconfig.json
```
Must exit with code 0.
</action>

**<accepted_criteria>**
- `flipCard` handler validates: turn, duplicate flip, evaluation lock
- On match: emits `cardMatched` with matched card IDs, updated scores
- On mismatch: after 1s delay, emits `mismatchResolved` with flipped-back card IDs, switch turn
- Third card flip while 2 are mid-evaluation is rejected via `evaluationLock`
- `npx tsc --noEmit --project server/tsconfig.json` exits 0
</accepted_criteria>

---

## <threat_model>

**Phase 2 — Game Engine (flip/match/turn logic)**

- Server-authoritative: all flip validation happens server-side. Client cannot cheat by sending invalid flips.
- Card icons are sent to the client only after a successful flip — the board state emitted on `gameStart` omits icons entirely, preventing board scraping.
- `evaluationLock` prevents rapid-click exploits: any flip event received while two cards are being evaluated is silently rejected.
- `Math.random()` used for shuffle is acceptable for casual play. For competitive play, replace with `crypto.randomBytes()`.
- **Risk:** Low. Game state is purely in-memory; no database, no authentication, no sensitive data.

</threat_model>

---

## <verification>

1. **Type check:** `npx tsc --noEmit --project server/tsconfig.json` exits 0
2. **Turn enforcement:** Client B sends `flipCard` during Client A's turn → receives error
3. **Duplicate flip:** Client sends `flipCard` on already-flipped card → receives error
4. **Evaluation lock:** Third `flipCard` while 2 cards visible → receives error
5. **Match flow:** Flip two matching cards → both marked matched, score increments, no turn switch
6. **Mismatch flow:** Flip two different cards → after 1s, both flip back, turn switches
7. **Board integrity:** Board still has 24 cards after multiple flips — no cards lost or duplicated
8. **`gameOver` on all matched:** When all 12 pairs matched, `gameOver` fires with `winner` or `null` (draw)

</verification>

## <success_criteria>

- [ ] Server rejects flip if it is not the player's turn (GAME-02)
- [ ] Server rejects flip on already-flipped or matched card (GAME-03)
- [ ] Server rejects flip while a pair is being evaluated (GAME-04)
- [ ] Match increments score by 1, player keeps turn (GAME-05)
- [ ] Mismatch flips cards back after 1 second, switches turn (GAME-06)
- [ ] `gameOver` emitted when all 12 pairs matched (GAME-07)
- [ ] Winner determined by score; returns null for draw (GAME-08)
- [ ] All card flip events are broadcast to room participants in real-time

</success_criteria>
