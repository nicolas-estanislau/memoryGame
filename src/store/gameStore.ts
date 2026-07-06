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
  disconnectCountdown: number | null;
  disconnectedPlayerId: string | null;
  isSpectator: boolean;
  rematchVotes: string[];
  activeReactions: { id: number; emoji: string; playerId: string }[];
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
  setDisconnectCountdown: (remaining: number, playerId: string) => void;
  clearDisconnectCountdown: () => void;
  setIsSpectator: (value: boolean) => void;
  setRematchVotes: (votes: string[]) => void;
  addReaction: (reaction: { id: number; emoji: string; playerId: string }) => void;
  removeReaction: (id: number) => void;
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
  disconnectCountdown: null,
  disconnectedPlayerId: null,
  isSpectator: false,
  rematchVotes: [],
  activeReactions: [],
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
      disconnectCountdown: null,
      disconnectedPlayerId: null,
      rematchVotes: [],
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
      disconnectCountdown: null,
      disconnectedPlayerId: null,
    }),

  setRoomUpdate: (players, status) =>
    set({ players, status: status as GameState["status"] }),

  setBoardLocked: (locked) => set({ isBoardLocked: locked }),

  setDisconnectCountdown: (remaining, playerId) =>
    set({ disconnectCountdown: remaining, disconnectedPlayerId: playerId }),

  clearDisconnectCountdown: () =>
    set({ disconnectCountdown: null, disconnectedPlayerId: null }),

  setIsSpectator: (value) => set({ isSpectator: value }),

  setRematchVotes: (votes) => set({ rematchVotes: votes }),

  addReaction: (reaction) =>
    set((state) => ({
      activeReactions: [...state.activeReactions, reaction],
    })),

  removeReaction: (id) =>
    set((state) => ({
      activeReactions: state.activeReactions.filter((r) => r.id !== id),
    })),

  reset: () => set(initialState),
}));
