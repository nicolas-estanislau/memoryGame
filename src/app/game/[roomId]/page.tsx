"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSocket } from "@/hooks/useSocket";
import { useGameSocket, emitFlipCard } from "@/hooks/useGameSocket";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { GameBoard } from "@/components/GameBoard";
import { Scoreboard } from "@/components/Scoreboard";
import { WinnerModal } from "@/components/WinnerModal";
import { WaitingRoom } from "@/components/WaitingRoom";
import { ReconnectBanner } from "@/components/ReconnectBanner";
import { ReactionBar } from "@/components/ReactionBar";
import { ReactionOverlay } from "@/components/ReactionOverlay";
import { Navbar } from "@/components/Navbar";

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  const board = useGameStore((s) => s.board);
  const status = useGameStore((s) => s.status);
  const isBoardLocked = useGameStore((s) => s.isBoardLocked);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const isSpectator = useGameStore((s) => s.isSpectator);
  const setRoomId = useGameStore((s) => s.setRoomId);
  const setMyPlayer = useGameStore((s) => s.setMyPlayer);

  const { play } = useSound();

  useGameSocket();
  useSoundEffects();

  useEffect(() => {
    setRoomId(roomId);
  }, [roomId, setRoomId]);

  useEffect(() => {
    if (status === "playing" || status === "finished") setIsLoading(false);
  }, [status]);

  useEffect(() => {
    const storedName = sessionStorage.getItem("playerName") || "Player";
    setName(storedName);
    if (!useGameStore.getState().myPlayerId) {
      setMyPlayer(getSocket()?.id ?? "", storedName);
    }
  }, [setMyPlayer]);

  useEffect(() => {
    if (joined) return;
    if (useGameStore.getState().myPlayerId) {
      setJoined(true);
      return;
    }
    if (!name || !roomId) return;

    setJoined(true);
    const socket = getSocket();
    if (!socket) return;
    socket.connect();

    socket.emit("joinRoom", { code: roomId, name }, (res: { error?: string }) => {
      if (res?.error) {
        console.error("Failed to join room:", res.error);
      }
    });
  }, [joined, name, roomId]);

  const handleCardClick = (cardId: number) => {
    if (isSpectator) return;
    play("flip");
    emitFlipCard(cardId);
  };

  const effectiveLock = isBoardLocked || status !== "playing" || isSpectator;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center py-8 gap-6">
        <ReconnectBanner />
        {status === "waiting" ? (
          <WaitingRoom roomCode={roomId} />
        ) : (
          <>
            <Scoreboard />
            <GameBoard
              cards={board}
              isLocked={effectiveLock}
              isLoading={isLoading}
              onCardClick={handleCardClick}
            />
            <ReactionBar />
            <WinnerModal />
          </>
        )}
        <ReactionOverlay />
      </main>
    </div>
  );
}
