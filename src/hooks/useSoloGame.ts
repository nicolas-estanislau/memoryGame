"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Card } from "@/types";
import { useSound } from "@/hooks/useSound";

const ICONS = [
  "nextjs", "react", "typescript", "tailwind",
  "nodejs", "socketio", "zustand", "framer",
  "git", "vscode", "docker", "vercel",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createBoard(): Card[] {
  const pairs = ICONS.flatMap((icon, idx) => [
    { id: idx * 2, icon, isFlipped: false, isMatched: false },
    { id: idx * 2 + 1, icon, isFlipped: false, isMatched: false },
  ]);
  return shuffle(pairs);
}

export function useSoloGame() {
  const [board, setBoard] = useState<Card[]>(() => createBoard());
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matched, setMatched] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const lockRef = useRef(false);
  const { play } = useSound();

  useEffect(() => {
    if (startTime === null || finished) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime, finished]);

  const handleCardClick = useCallback((id: number) => {
    if (lockRef.current) return;

    setBoard((prev) => {
      const card = prev.find((c) => c.id === id);
      if (!card || card.isFlipped || card.isMatched) return prev;

      if (!startTime) setStartTime(Date.now());

      play("flip");

      const next = prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
      const newFlipped = [...flippedIds, id];

      if (newFlipped.length === 2) {
        lockRef.current = true;
        setIsLocked(true);
        setMoves((m) => m + 1);

        const [a, b] = newFlipped;
        const cardA = next.find((c) => c.id === a)!;
        const cardB = next.find((c) => c.id === b)!;

        if (cardA.icon === cardB.icon) {
          const matchedBoard = next.map((c) =>
            c.id === a || c.id === b ? { ...c, isMatched: true } : c,
          );
          setFlippedIds([]);
          setMatched((m) => {
            const newMatched = m + 1;
            if (newMatched === 12) {
              setFinished(true);
            }
            return newMatched;
          });
          play("match");

          const allMatched = matchedBoard.every((c) => c.isMatched || (c.id === a || c.id === b));
          if (allMatched) play("win");

          lockRef.current = false;
          setIsLocked(false);
          return matchedBoard;
        } else {
          setTimeout(() => {
            setBoard((p) => p.map((c) =>
              c.id === a || c.id === b ? { ...c, isFlipped: false } : c,
            ));
            setFlippedIds([]);
            lockRef.current = false;
            setIsLocked(false);
          }, 1000);
          return next;
        }
      }

      setFlippedIds(newFlipped);
      return next;
    });
  }, [flippedIds, startTime, play]);

  const restart = useCallback(() => {
    setBoard(createBoard());
    setFlippedIds([]);
    setMatched(0);
    setMoves(0);
    setIsLocked(false);
    setStartTime(null);
    setElapsed(0);
    setFinished(false);
    lockRef.current = false;
  }, []);

  return {
    board,
    matched,
    moves,
    elapsed,
    finished,
    isLocked,
    handleCardClick,
    restart,
  };
}
