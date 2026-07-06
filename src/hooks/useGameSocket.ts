"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/store/gameStore";
import { useAppStore } from "@/store";

export function useGameSocket() {
  const initialized = useRef(false);
  const {
    setGameStart,
    setCardFlipped,
    setCardMatched,
    setMismatchResolved,
    setTimerTick,
    setGameOver,
    setRoomUpdate,
    setDisconnectCountdown,
    clearDisconnectCountdown,
    setRematchVotes,
    addReaction,
    removeReaction,
  } = useGameStore();
  const setSocketConnected = useAppStore((s) => s.setSocketConnected);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket();
    if (!socket) return;

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("gameStart", ({ board, players, currentTurn }) => {
      setGameStart(board, players, currentTurn);
    });

    socket.on("cardFlipped", ({ cardId, icon }) => {
      setCardFlipped(cardId, icon);
    });

    socket.on("cardMatched", ({ cardIds, playerId, score, players }) => {
      setCardMatched(cardIds, playerId, score, players);
    });

    socket.on("mismatchResolved", ({ cardIds, currentTurn, players }) => {
      setMismatchResolved(cardIds, currentTurn, players);
    });

    socket.on("timerTick", ({ elapsedTime }) => {
      setTimerTick(elapsedTime);
    });

    socket.on("gameOver", ({ winner, players, elapsedTime }) => {
      setGameOver(winner, players, elapsedTime);
    });

    socket.on("roomUpdate", ({ players, status }) => {
      setRoomUpdate(players, status);
    });

    socket.on("disconnectCountdown", ({ remaining, playerId }) => {
      setDisconnectCountdown(remaining, playerId);
    });

    socket.on("opponentReconnected", () => {
      clearDisconnectCountdown();
    });

    socket.on("rematchVote", ({ playerId, votes }) => {
      setRematchVotes(votes);
    });

    socket.on("roomReaction", ({ playerId, emoji }) => {
      const id = Date.now();
      addReaction({ id, emoji, playerId });
      setTimeout(() => removeReaction(id), 3500);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("gameStart");
      socket.off("cardFlipped");
      socket.off("cardMatched");
      socket.off("mismatchResolved");
      socket.off("timerTick");
      socket.off("gameOver");
      socket.off("roomUpdate");
      socket.off("disconnectCountdown");
      socket.off("opponentReconnected");
      socket.off("rematchVote");
      socket.off("roomReaction");
    };
  }, [
    setGameStart, setCardFlipped, setCardMatched, setMismatchResolved,
    setTimerTick, setGameOver, setRoomUpdate, setDisconnectCountdown,
    clearDisconnectCountdown, setRematchVotes, addReaction, removeReaction, setSocketConnected,
  ]);
}

export function emitFlipCard(cardId: number) {
  const socket = getSocket();
  if (!socket) return;
  useGameStore.getState().setBoardLocked(true);
  socket.emit("flipCard", { cardId }, (res: { success?: boolean; error?: string }) => {
    if (res?.error) {
      useGameStore.getState().setBoardLocked(false);
    }
  });
}

export function emitRequestRematch() {
  getSocket()?.emit("requestRematch");
}

export function emitLeaveRoom() {
  getSocket()?.emit("leaveRoom");
}

export function emitReconnectToGame(roomId: string, playerId: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    if (!socket) {
      reject(new Error("Socket not available"));
      return;
    }
    socket.emit("reconnectToGame", { roomId, playerId }, (res: unknown) => {
      resolve(res);
    });
  });
}

export function emitSendReaction(emoji: string) {
  getSocket()?.emit("sendReaction", { emoji });
}
