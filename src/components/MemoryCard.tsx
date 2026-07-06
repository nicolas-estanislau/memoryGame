"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const imageMap: Record<string, string> = {
  nextjs: "/assets/card-01.png",
  react: "/assets/card-02.jpg",
  typescript: "/assets/card-03.jpg",
  tailwind: "/assets/card-04.jpg",
  nodejs: "/assets/card-05.jpg",
  socketio: "/assets/card-06.jpg",
  zustand: "/assets/card-07.jpg",
  framer: "/assets/card-08.jpg",
  git: "/assets/card-09.jpg",
  vscode: "/assets/card-10.jpg",
  docker: "/assets/card-11.jpg",
  vercel: "/assets/card-12.jpg",
};

interface MemoryCardProps {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
  disabled: boolean;
  onClick: (id: number) => void;
}

export function MemoryCard({
  id,
  icon,
  isFlipped,
  isMatched,
  disabled,
  onClick,
}: MemoryCardProps) {
  const src = imageMap[icon];
  const shouldReduceMotion = useReducedMotion();
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: "easeInOut" as const };

  return (
    <motion.button
      onClick={() => onClick(id)}
      disabled={disabled || isMatched || isFlipped}
      className={cn(
        "relative aspect-[3/4] w-full rounded-lg border bg-card text-2xl font-bold",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
        isMatched && "border-violet-500 ring-2 ring-violet-500/50 scale-[1.02] opacity-90",
        !isFlipped && !isMatched && "bg-muted hover:bg-muted/80 cursor-pointer",
      )}
      style={{ perspective: 600 }}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={transition}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted"
        style={{ backfaceVisibility: "hidden" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={transition}
      />
      <motion.div
        className="absolute inset-0 flex items-center justify-center rounded-lg bg-card p-1"
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        animate={{ rotateY: isFlipped ? 0 : -180 }}
        transition={transition}
      >
        {src && (
          <img
            src={src}
            alt=""
            className="w-full h-full object-contain rounded-md"
            draggable={false}
          />
        )}
      </motion.div>
    </motion.button>
  );
}
