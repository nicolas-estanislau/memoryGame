"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SoloCompleteProps {
  open: boolean;
  matched: number;
  moves: number;
  elapsed: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function SoloComplete({
  open,
  matched,
  moves,
  elapsed,
  onPlayAgain,
  onHome,
}: SoloCompleteProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">You win!</DialogTitle>
          <DialogDescription className="text-center">
            All pairs matched
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{matched}</div>
            <div className="text-xs text-muted-foreground">Pairs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{moves}</div>
            <div className="text-xs text-muted-foreground">Moves</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatTime(elapsed)}</div>
            <div className="text-xs text-muted-foreground">Time</div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onHome}>
            Home
          </Button>
          <Button className="flex-1" onClick={onPlayAgain}>
            Play Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
