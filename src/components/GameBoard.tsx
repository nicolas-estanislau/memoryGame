"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/MemoryCard";
import type { Card } from "@/types";

interface GameBoardProps {
  cards: Card[];
  isLocked: boolean;
  isLoading: boolean;
  onCardClick: (cardId: number) => void;
}

export function GameBoard({
  cards,
  isLocked,
  isLoading,
  onCardClick,
}: GameBoardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2 max-w-[480px] w-full px-4">
        {Array.from({ length: 24 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 max-w-[480px] w-full px-4">
      {cards.map((card) => (
        <MemoryCard
          key={card.id}
          id={card.id}
          icon={card.icon}
          isFlipped={card.isFlipped}
          isMatched={card.isMatched}
          disabled={isLocked}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
