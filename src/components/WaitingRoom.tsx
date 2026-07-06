"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LeaveDialog } from "@/components/LeaveDialog";

interface WaitingRoomProps {
  roomCode: string;
}

export function WaitingRoom({ roomCode }: WaitingRoomProps) {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast.success("Room code copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Memory Game",
      text: `Join my Memory Game room! Code: ${roomCode}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(roomCode);
      toast.success("Room code copied!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold">Waiting for opponent</h2>
        <p className="text-muted-foreground">
          Share the room code to let someone join
        </p>
      </div>

      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">Room Code</p>
        <p className="text-5xl font-mono font-bold tracking-[0.25em]">
          {roomCode}
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleCopy}>Copy Code</Button>
        <Button variant="outline" onClick={handleShare}>
          Share
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
        Waiting for opponent to join...
      </div>

      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowLeaveDialog(true)}
      >
        Leave Room
      </Button>

      <LeaveDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
      />
    </div>
  );
}
