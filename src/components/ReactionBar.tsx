"use client";

import { emitSendReaction } from "@/hooks/useGameSocket";

const EMOJIS = ["🎉", "🔥", "👏", "😂", "😮", "❤️"];

export function ReactionBar() {
  return (
    <div className="flex gap-1.5 justify-center">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => emitSendReaction(emoji)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent transition-colors"
          aria-label={`Send ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
