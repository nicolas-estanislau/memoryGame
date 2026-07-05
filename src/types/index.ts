export interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  moves: number;
  isConnected: boolean;
}

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

export interface GameState {
  roomId: string;
  board: Card[];
  players: Player[];
  currentTurn: string | null;
  status: "waiting" | "playing" | "finished";
  winner: string | null;
  elapsedTime: number;
}
