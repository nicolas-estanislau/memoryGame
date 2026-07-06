"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/store/gameStore";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

interface JoinRoomCallback {
  roomId?: string;
  playerId?: string | null;
  isSpectator?: boolean;
  error?: string;
  state?: {
    board: { id: number; icon: string; isFlipped: boolean; isMatched: boolean }[];
    players: { id: string; name: string; score: number; moves: number; isConnected: boolean }[];
    currentTurn: string | null;
    status: string;
    elapsedTime: number;
  };
}

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("playerName") || "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const setRoomId = useGameStore((s) => s.setRoomId);
  const setMyPlayer = useGameStore((s) => s.setMyPlayer);
  const setGameStart = useGameStore((s) => s.setGameStart);
  const setIsSpectator = useGameStore((s) => s.setIsSpectator);

  const handleJoin = useCallback(() => {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setError("Please enter a room code");
      return;
    }
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);
    setError("");
    sessionStorage.setItem("playerName", trimmedName);

    const socket = getSocket();
    if (!socket) {
      setError("Failed to connect to server");
      setIsLoading(false);
      return;
    }

    socket.connect();

    socket.emit(
      "joinRoom",
      { code: trimmedCode, name: trimmedName },
      (res: JoinRoomCallback) => {
        if (res.error) {
          setError(res.error);
          toast.error(res.error);
          setIsLoading(false);
          return;
        }
        if (res.isSpectator && res.roomId && res.state) {
          setRoomId(res.roomId);
          setIsSpectator(true);
          setGameStart(res.state.board, res.state.players, res.state.currentTurn ?? "");
          router.push(`/game/${res.roomId}`);
          return;
        }
        if (res.roomId && res.playerId) {
          setRoomId(res.roomId);
          setMyPlayer(res.playerId, trimmedName);
          router.push(`/game/${res.roomId}`);
        }
      },
    );
  }, [code, name, router, setRoomId, setMyPlayer, setGameStart, setIsSpectator]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-2xl font-bold text-center">Join a Room</h1>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">
                Room Code
              </label>
              <input
                id="code"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                placeholder="Enter room code"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                maxLength={6}
                autoFocus
              />
            </div>
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
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              className="w-full"
              onClick={handleJoin}
              disabled={isLoading}
            >
              {isLoading ? "Joining..." : "Join Room"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
