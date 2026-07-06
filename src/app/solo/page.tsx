"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GameBoard } from "@/components/GameBoard";
import { SoloComplete } from "@/components/SoloComplete";
import { useSoloGame } from "@/hooks/useSoloGame";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SoloPage() {
  const router = useRouter();
  const { board, matched, moves, elapsed, finished, isLocked, handleCardClick, restart } =
    useSoloGame();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center py-8 gap-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold">{matched}</div>
            <div className="text-muted-foreground">Pairs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{moves}</div>
            <div className="text-muted-foreground">Moves</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{formatTime(elapsed)}</div>
            <div className="text-muted-foreground">Time</div>
          </div>
        </div>
        <GameBoard
          cards={board}
          isLocked={isLocked}
          isLoading={false}
          onCardClick={handleCardClick}
        />
        <SoloComplete
          open={finished}
          matched={matched}
          moves={moves}
          elapsed={elapsed}
          onPlayAgain={restart}
          onHome={() => router.push("/")}
        />
      </main>
    </div>
  );
}
