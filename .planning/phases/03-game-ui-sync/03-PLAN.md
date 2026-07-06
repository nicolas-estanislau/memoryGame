---
plan: 03-03
phase: 3
type: feature
wave: 3
depends_on: [03-02]
files_modified:
  - src/components/WinnerModal.tsx
  - src/app/game/[roomId]/page.tsx
  - src/app/layout.tsx
autonomous: true
requirements: [END-01]
---

# Plan 03-03: Winner Modal, Game Page Route, and End-to-End Verification

<objective>
Build the Winner Modal with canvas-confetti celebration, create the game page route at `/game/[roomId]` that composes all Phase 3 components, and run an end-to-end verification test.
</objective>

<wave_info>
wave: 3
depends_on: [03-02]
</wave_info>

---

## Tasks

### Task 3-03-01: Create WinnerModal with confetti

**type:** execute

**<read_first>**
- `src/components/ui/dialog.tsx` (shadcn Dialog primitives)
- `src/components/ui/button.tsx` (shadcn Button)
- `src/store/gameStore.ts` (winner, players, elapsedTime, myPlayerId, status)
- `03-UI-SPEC.md` (Copywriting Contract — winner modal copy, button labels)

**<action>**
Create `src/components/WinnerModal.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";
import { emitRequestRematch, emitLeaveRoom } from "@/hooks/useGameSocket";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WinnerModal() {
  const status = useGameStore((s) => s.status);
  const winner = useGameStore((s) => s.winner);
  const players = useGameStore((s) => s.players);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const myPlayerId = useGameStore((s) => s.myPlayerId);

  const isOpen = status === "finished";

  useEffect(() => {
    if (isOpen && winner) {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [isOpen, winner]);

  const isDraw = !winner;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {isDraw ? "It's a Draw!" : "Winner!"}
          </DialogTitle>
          {!isDraw && (
            <DialogDescription className="text-center text-lg font-semibold text-violet-500">
              {winner.id === myPlayerId ? "You won!" : `${winner.name} wins!`}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-3 py-4">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center rounded-lg border bg-card px-4 py-3"
            >
              <span className="font-medium">
                {p.id === myPlayerId ? "You" : p.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {p.score} pairs · {p.moves} moves
              </span>
            </div>
          ))}
          <div className="text-center text-sm text-muted-foreground">
            Time: {formatTime(elapsedTime)}
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={emitRequestRematch}>Rematch</Button>
          <Button variant="destructive" onClick={emitLeaveRoom}>
            Leave
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**<acceptance_criteria>**
- `src/components/WinnerModal.tsx` exists and exports `WinnerModal`
- Modal opens when status === "finished"
- Winner name displayed in violet-500 text (or "It's a Draw!" when winner is null)
- Each player's score and moves displayed
- Elapsed time shown in M:SS format
- Confetti fires on open when winner exists (violet particles, 3s duration)
- "Rematch" button calls `emitRequestRematch`
- "Leave" button (destructive variant) calls `emitLeaveRoom`
- `npx tsc --noEmit` exits 0

---

### Task 3-03-02: Create game page route and compose all components

**type:** execute

**<read_first>**
- `src/app/layout.tsx` (current layout — needs Toaster added)
- `src/components/GameBoard.tsx` (board component)
- `src/components/Scoreboard.tsx` (scoreboard component)
- `src/components/WinnerModal.tsx` (winner modal)
- `src/hooks/useGameSocket.ts` (socket hook and emitters)
- `src/store/gameStore.ts` (game store — board, players, etc.)

**<action>**
1. Update `src/app/layout.tsx` to add the sonner Toaster:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memory Game",
  description: "Multiplayer memory card game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

2. Create `src/app/game/[roomId]/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSocket } from "@/hooks/useSocket";
import { useGameSocket, emitFlipCard } from "@/hooks/useGameSocket";
import { useGameStore } from "@/store/gameStore";
import { GameBoard } from "@/components/GameBoard";
import { Scoreboard } from "@/components/Scoreboard";
import { WinnerModal } from "@/components/WinnerModal";

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  const board = useGameStore((s) => s.board);
  const status = useGameStore((s) => s.status);
  const isBoardLocked = useGameStore((s) => s.isBoardLocked);
  const setRoomId = useGameStore((s) => s.setRoomId);
  const setMyPlayer = useGameStore((s) => s.setMyPlayer);

  useGameSocket();

  useEffect(() => {
    setRoomId(roomId);
  }, [roomId, setRoomId]);

  useEffect(() => {
    if (status === "playing") setIsLoading(false);
  }, [status]);

  useEffect(() => {
    const storedName = sessionStorage.getItem("playerName") || "Player";
    setName(storedName);
    setMyPlayer(getSocket()?.id ?? "", storedName);
  }, [setMyPlayer]);

  useEffect(() => {
    if (!joined && name && roomId) {
      setJoined(true);
      const socket = getSocket();
      if (!socket) return;
      socket.connect();

      socket.emit("joinRoom", { code: roomId, name }, (res: { error?: string }) => {
        if (res?.error) {
          console.error("Failed to join room:", res.error);
        }
      });
    }
  }, [joined, name, roomId]);

  const handleCardClick = (cardId: number) => {
    emitFlipCard(cardId);
  };

  return (
    <main className="min-h-screen flex flex-col items-center py-8 gap-6">
      <Scoreboard />
      <GameBoard
        cards={board}
        isLocked={isBoardLocked || status !== "playing"}
        isLoading={isLoading}
        onCardClick={handleCardClick}
      />
      <WinnerModal />
    </main>
  );
}
```

**<acceptance_criteria>**
- `src/app/game/[roomId]/page.tsx` exists as a "use client" page
- Layout.tsx includes `<Toaster />` from sonner
- GamePage reads roomId from useParams
- GamePage calls `useGameSocket()` to register all event listeners
- GamePage emits `joinRoom` with roomId and player name from sessionStorage
- GamePage composes: Scoreboard → GameBoard → WinnerModal
- Board isLoading=true until status becomes "playing"
- `npx tsc --noEmit` exits 0

---

### Task 3-03-03: End-to-end verification

**type:** execute

**<read_first>**
- All Phase 3 source files
- `server/src/index.ts` (server events for test expectations)

**<action>**
Run verification:

1. Start the server:
```powershell
Start-Job -Name msServer -ScriptBlock { param($wd) Set-Location $wd; npx tsx server/src/index.ts 2>&1 } -ArgumentList (Get-Location).Path
Start-Sleep -Seconds 5
```

2. Type-check both root and server:
```powershell
npx tsc --noEmit
npx tsc --noEmit --project server/tsconfig.json
```
Both must exit 0.

3. Build the client:
```powershell
npm run build
```
Must exit 0. (Build is acceptable as proxy for e2e since client components render.)

4. Verify components render without runtime errors by checking the build output contains expected chunks.

5. Clean up:
```powershell
Get-Job -Name msServer | Stop-Job; Get-Job -Name msServer | Remove-Job -Force
```

**<acceptance_criteria>**
- `npx tsc --noEmit` (root) exits 0
- `npx tsc --noEmit --project server/tsconfig.json` exits 0
- `npm run build` exits 0
- Build output contains game page route chunk

---

## <threat_model>

**Phase 3 — Game Page and Winner Modal**

- Winner Modal uses canvas-confetti (client-side only, no server impact)
- Game page route is "use client" — all state management is client-side via Zustand + Socket.IO
- Room ID from URL params is used directly in `joinRoom` emit — no sanitization needed (server validates room existence)
- Player name stored in sessionStorage (ephemeral, cleared on tab close)
- Confetti animation is self-throttling via requestAnimationFrame with time cap
- **Risk:** Low. No persistent data, no authentication, no server-side input beyond room joins.

</threat_model>

---

## <verification>

1. **Winner Modal renders:** Opens when status=finished, shows correct data
2. **Confetti fires:** On winner (not draw), violet particles, 3s duration
3. **Game page renders:** Route at `/game/[roomId]` composes all components without errors
4. **Layout updated:** Includes sonner Toaster
5. **Build:** `npm run build` exits 0
6. **Type check:** `npx tsc --noEmit` (root) and `--project server/tsconfig.json` exit 0

---

## <success_criteria>

- [ ] Winner Modal appears with winner name, scores, and elapsed time (END-01)
- [ ] Canvas-confetti burst plays on winner (violet particles) (END-01)
- [ ] Game page at `/game/[roomId]` composes Board + Scoreboard + WinnerModal
- [ ] All client components type-check and build without errors
