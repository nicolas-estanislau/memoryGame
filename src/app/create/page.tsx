"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/store/gameStore";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

export default function CreatePage() {
  const router = useRouter();
  const [name, setName] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("playerName") || "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const setRoomId = useGameStore((s) => s.setRoomId);
  const setMyPlayer = useGameStore((s) => s.setMyPlayer);

  const handleCreate = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a name");
      return;
    }

    setIsLoading(true);
    setError("");
    sessionStorage.setItem("playerName", trimmed);

    const socket = getSocket();
    if (!socket) {
      setError("Failed to connect to server");
      setIsLoading(false);
      return;
    }

    socket.connect();

    socket.emit(
      "createRoom",
      { name: trimmed },
      (res: { roomId?: string; playerId?: string; error?: string }) => {
        if (res.error) {
          setError(res.error);
          setIsLoading(false);
          return;
        }
        if (res.roomId && res.playerId) {
          setRoomId(res.roomId);
          setMyPlayer(res.playerId, trimmed);
          router.push(`/game/${res.roomId}`);
        }
      },
    );
  }, [name, router, setRoomId, setMyPlayer]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-2xl font-bold text-center">Create a Room</h1>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Your Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Enter your name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                maxLength={20}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
