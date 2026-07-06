"use client";

import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";

export function ReconnectBanner() {
  const disconnectCountdown = useGameStore((s) => s.disconnectCountdown);
  const disconnectedPlayerId = useGameStore((s) => s.disconnectedPlayerId);
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  if (disconnectCountdown === null || !disconnectedPlayerId) return null;

  const disconnectedPlayer = players.find((p) => p.id === disconnectedPlayerId);
  const isMe = disconnectedPlayerId === myPlayerId;

  return (
    <div
      className={cn(
        "w-full max-w-[480px] mx-auto px-4 py-2 rounded-lg text-center text-sm",
        "bg-amber-50 border border-amber-200 text-amber-800",
        "dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200",
      )}
    >
      {isMe
        ? `You disconnected. Reconnecting... (${disconnectCountdown}s)`
        : `${disconnectedPlayer?.name ?? "Opponent"} disconnected. Waiting ${disconnectCountdown}s...`}
    </div>
  );
}
