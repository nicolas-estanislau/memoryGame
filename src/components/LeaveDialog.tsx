"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { emitLeaveRoom } from "@/hooks/useGameSocket";
import { useGameStore } from "@/store/gameStore";

interface LeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveDialog({ open, onOpenChange }: LeaveDialogProps) {
  const router = useRouter();

  const handleLeave = () => {
    emitLeaveRoom();
    useGameStore.getState().reset();
    onOpenChange(false);
    router.push("/");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Room?</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave? This will end the game.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLeave}>
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
