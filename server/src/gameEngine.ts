import type { Card, Room } from "../../src/types/index.js";

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
