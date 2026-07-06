import type { Room, Player } from "../../src/types/index.js";

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

function addPlayer(code: string, _socketId: string, name: string, playerId: string): Player | null {
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

function addSpectator(code: string, socketId: string): boolean {
  const data = rooms.get(code.toUpperCase());
  if (!data) return false;
  if (data.room.spectators.includes(socketId)) return false;
  data.room.spectators.push(socketId);
  return true;
}

function removeSpectator(code: string, socketId: string): boolean {
  const data = rooms.get(code.toUpperCase());
  if (!data) return false;
  data.room.spectators = data.room.spectators.filter((s) => s !== socketId);
  return true;
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
  addSpectator,
  removeSpectator,
  removePlayer,
  deleteRoom,
  getRoomCount,
  type RoomData,
};
