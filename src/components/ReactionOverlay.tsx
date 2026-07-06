"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

export function ReactionOverlay() {
  const activeReactions = useGameStore((s) => s.activeReactions);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {activeReactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            className="absolute bottom-20 text-3xl"
            style={{ left: `${10 + Math.random() * 80}%` }}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -200, opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
