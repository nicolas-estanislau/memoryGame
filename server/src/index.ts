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
  resetForRematch,
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
    current.room.elapsedTime = (current.room.elapsedTime ?? 0) + 1;
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
        stopGameTimer(roomId);
        const winner = determineWinner(data.room);
        io.to(roomId).emit("gameOver", {
          winner,
          players: data.room.players.map((p) => ({
            id: p.id, name: p.name, score: p.score, moves: p.moves,
          })),
          elapsedTime: data.room.elapsedTime ?? 0,
        });
      }
    }

    if (data.room.flippedCards.length === 2) {
      const cardIds = [...data.room.flippedCards];
      data.evaluationLock = true;
      setTimeout(() => {
        executeMismatch(data.room);
        data.evaluationLock = false;
        io.to(roomId).emit("mismatchResolved", {
          cardIds,
          currentTurn: data.room.currentTurn,
          players: data.room.players.map((p) => ({ id: p.id, name: p.name, score: p.score, moves: p.moves })),
        });
      }, MISMATCH_DELAY_MS);
    }
  });

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
