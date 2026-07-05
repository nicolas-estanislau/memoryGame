import { create } from "zustand";

interface AppState {
  socketConnected: boolean;
  setSocketConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  socketConnected: false,
  setSocketConnected: (connected) => set({ socketConnected: connected }),
}));
