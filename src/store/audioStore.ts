import { create } from "zustand";

interface AudioState {
  isMuted: boolean;
  toggleMute: () => void;
}

function getInitialMuted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("soundMuted") === "true";
}

export const useAudioStore = create<AudioState>((set) => ({
  isMuted: getInitialMuted(),
  toggleMute: () =>
    set((state) => {
      const newMuted = !state.isMuted;
      localStorage.setItem("soundMuted", String(newMuted));
      return { isMuted: newMuted };
    }),
}));
