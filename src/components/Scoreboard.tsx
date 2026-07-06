"use client";

import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Scoreboard() {
  const players = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const status = useGameStore((s) => s.status);

  if (players.length === 0) return null;

  return (
    <div className="flex items-center justify-between max-w-[480px] mx-auto px-4 py-3 gap-4">
      {players.map((player) => {
        const isActive = currentTurn === player.id;
        const isMe = player.id === myPlayerId;
        return (
          <div
            key={player.id}
            className={cn(
              "flex-1 rounded-lg border bg-card p-3 transition-colors",
              isActive && "border-l-4 border-l-violet-500",
            )}
          >
            <div className="text-sm font-medium">
              {isMe ? "You" : player.name}
              {isActive && <span className="ml-2 text-xs text-violet-500">● Your Turn</span>}
              {status === "playing" && !isActive && isMe && (
                <span className="ml-2 text-xs text-muted-foreground">○ Opponent&apos;s Turn</span>
              )}
            </div>
            <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
              <span>{player.score} pairs</span>
              <span>{player.moves} moves</span>
            </div>
          </div>
        );
      })}
      {status === "playing" && (
        <div className="text-sm font-mono text-muted-foreground whitespace-nowrap">
          {formatTime(elapsedTime)}
        </div>
      )}
    </div>
  );
}
