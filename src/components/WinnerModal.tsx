"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";
import { emitRequestRematch, emitLeaveRoom } from "@/hooks/useGameSocket";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WinnerModal() {
  const status = useGameStore((s) => s.status);
  const winner = useGameStore((s) => s.winner);
  const players = useGameStore((s) => s.players);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const rematchVotes = useGameStore((s) => s.rematchVotes);
  const isSpectator = useGameStore((s) => s.isSpectator);

  const isOpen = status === "finished";

  useEffect(() => {
    if (isOpen && winner) {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [isOpen, winner]);

  const isDraw = !winner;
  const myVoted = myPlayerId && rematchVotes.includes(myPlayerId);
  const allVoted = players.every((p) => rematchVotes.includes(p.id));

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {isDraw ? "It&apos;s a Draw!" : "Winner!"}
          </DialogTitle>
          {!isDraw && (
            <DialogDescription className="text-center text-lg font-semibold text-violet-500">
              {winner.id === myPlayerId ? "You won!" : `${winner.name} wins!`}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-3 py-4">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center rounded-lg border bg-card px-4 py-3"
            >
              <span className="font-medium">
                {p.id === myPlayerId ? "You" : p.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {p.score} pairs · {p.moves} moves
              </span>
            </div>
          ))}
          <div className="text-center text-sm text-muted-foreground">
            Time: {formatTime(elapsedTime)}
          </div>
        </div>
        {!isSpectator && (
          <div className="space-y-3">
            {allVoted ? (
              <p className="text-center text-sm text-muted-foreground">
                Starting rematch...
              </p>
            ) : myVoted ? (
              <p className="text-center text-sm text-muted-foreground">
                Waiting for opponent to accept rematch...
              </p>
            ) : (
              <div className="flex gap-3 justify-center">
                <Button onClick={emitRequestRematch}>Rematch</Button>
                <Button variant="destructive" onClick={emitLeaveRoom}>
                  Leave
                </Button>
              </div>
            )}
          </div>
        )}
        {isSpectator && (
          <div className="flex justify-center">
            <Button variant="destructive" onClick={emitLeaveRoom}>
              Leave
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
