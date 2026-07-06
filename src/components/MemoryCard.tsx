"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const iconMap: Record<string, string> = {
  nextjs: "▲",
  react: "⚛",
  typescript: "TS",
  tailwind: "◆",
  nodejs: "●",
  socketio: "◄",
  zustand: "■",
  framer: "◎",
  git: "■",
  vscode: "◆",
  docker: "■",
  vercel: "▲",
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
  const display = iconMap[icon] ?? "?";

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
      animate={{
        rotateY: isFlipped ? 180 : 0,
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center rounded-lg bg-card"
        style={{ backfaceVisibility: "hidden" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {display}
      </motion.div>
      <motion.div
        className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted"
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        animate={{ rotateY: isFlipped ? 0 : -180 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </motion.button>
  );
}
