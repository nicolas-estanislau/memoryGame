"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";

export function useSoundEffects() {
  const { play } = useSound();
  const board = useGameStore((s) => s.board);
  const status = useGameStore((s) => s.status);
  const prevMatchCount = useRef(0);
  const prevStatus = useRef(status);

  const matchCount = board.filter((c) => c.isMatched).length;

  useEffect(() => {
    if (matchCount > prevMatchCount.current && matchCount > 0) {
      play("match");
    }
    prevMatchCount.current = matchCount;
  }, [matchCount, play]);

  useEffect(() => {
    if (status === "finished" && prevStatus.current !== "finished") {
      play("win");
    }
    prevStatus.current = status;
  }, [status, play]);
}
