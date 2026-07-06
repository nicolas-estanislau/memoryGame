---
plan: 03-01
phase: 3
type: feature
wave: 1
depends_on: []
files_modified:
  - src/components/GameBoard.tsx
  - src/components/MemoryCard.tsx
  - src/app/globals.css
autonomous: true
requirements: [BOARD-01, BOARD-02, BOARD-03, BOARD-04, BONUS-03]
---

# Plan 03-01: Game Board, Card Components with Framer Motion Animations

<objective>
Build the core game board UI: a responsive 4×6 grid of 24 memory cards with Framer Motion 3D flip animations, matched-card visual distinction, board lock state, and a loading skeleton state. Cards display web dev tech stack icons (lucide-react) when face-up.
</objective>

<wave_info>
wave: 1
depends_on: []
</wave_info>

---

## Tasks

### Task 3-01-01: Install dependencies

**type:** execute

**<read_first>**
- `package.json` (current dependencies)

**<action>**
Install Framer Motion and canvas-confetti:

```powershell
npm install framer-motion canvas-confetti
npm install --save-dev @types/canvas-confetti
```

Verify:
```powershell
node -e "require('framer-motion'); require('canvas-confetti'); console.log('ok')"
```
Should print `ok`.

---

### Task 3-01-02: Create MemoryCard component with Framer Motion 3D flip animation

**type:** execute

**<read_first>**
- `src/components/ui/card.tsx` (shadcn Card pattern — use as layout wrapper)
- `src/lib/utils.ts` (cn utility)
- `src/types/index.ts` (Card interface)
- `03-UI-SPEC.md` (Interaction Specs — flip animation, color tokens)

**<action>**
Create `src/components/MemoryCard.tsx`:

```typescript
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MemoryCardProps {
  cardId: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
  isLocked: boolean;
  onClick: (cardId: number) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  nextjs: <span>▲</span>,
  react: <span>⚛</span>,
  typescript: <span>TS</span>,
  tailwind: <span>TW</span>,
  nodejs: <span>▼</span>,
  socketio: <span>◇</span>,
  zustand: <span>⩂</span>,
  framer: <span>◇</span>,
  git: <span>○</span>,
  vscode: <span>▣</span>,
  docker: <span>□</span>,
  vercel: <span>▲</span>,
};

export function MemoryCard({
  cardId,
  icon,
  isFlipped,
  isMatched,
  isLocked,
  onClick,
}: MemoryCardProps) {
  const handleClick = () => {
    if (!isFlipped && !isMatched && !isLocked) {
      onClick(cardId);
    }
  };

  return (
    <div
      className={cn(
        "aspect-[3/4] cursor-pointer select-none",
        isLocked && "pointer-events-none",
      )}
      onClick={handleClick}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-xl border bg-card shadow-sm backface-hidden",
            "flex items-center justify-center",
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="text-3xl text-muted-foreground">?</span>
        </div>
        <div
          className={cn(
            "absolute inset-0 rounded-xl border bg-card shadow-sm backface-hidden",
            "flex items-center justify-center",
            isMatched && "border-violet-500 ring-2 ring-violet-500/50 opacity-90 scale-[1.02]",
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <span className="text-3xl">{iconMap[icon] || <span>?</span>}</span>
        </div>
      </motion.div>
    </div>
  );
}
```

**<acceptance_criteria>**
- `src/components/MemoryCard.tsx` exists and exports `MemoryCard`
- Component accepts: cardId, icon, isFlipped, isMatched, isLocked, onClick props
- Face-down side shows `?` with muted-foreground color
- Face-up side shows icon from iconMap with 3xl font size
- Matched state: violet border (border-violet-500) + ring + 90% opacity + 1.02 scale
- isLocked=true applies pointer-events-none to parent div
- Flipping animation uses motion.div with rotateY(180) at 0.4s easeInOut
- Both sides have backface-visibility: hidden
- `npx tsc --noEmit` exits 0

---

### Task 3-01-03: Create GameBoard component with responsive 4×6 grid and skeleton loading

**type:** execute

**<read_first>**
- `src/components/MemoryCard.tsx` (just created)
- `src/components/ui/skeleton.tsx` (shadcn Skeleton)
- `03-UI-SPEC.md` (Board Layout — 4×6, 3:4, 480px max, 8px gap)

**<action>**
Create `src/components/GameBoard.tsx`:

```typescript
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { MemoryCard } from "@/components/MemoryCard";

interface CardData {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameBoardProps {
  cards: CardData[];
  isLocked: boolean;
  isLoading: boolean;
  onCardClick: (cardId: number) => void;
}

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-2 max-w-[480px] mx-auto">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="aspect-[3/4]">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function GameBoard({ cards, isLocked, isLoading, onCardClick }: GameBoardProps) {
  if (isLoading) return <BoardSkeleton />;

  return (
    <div className="grid grid-cols-4 gap-2 max-w-[480px] mx-auto px-4">
      {cards.map((card) => (
        <MemoryCard
          key={card.id}
          cardId={card.id}
          icon={card.icon}
          isFlipped={card.isFlipped}
          isMatched={card.isMatched}
          isLocked={isLocked}
          onClick={onCardClick}
        />
      ))}
    </div>
  );
}
```

**<acceptance_criteria>**
- `src/components/GameBoard.tsx` exists and exports `GameBoard` and `BoardSkeleton`
- GameBoard renders a 4-column CSS grid with gap-2
- Max width of board container is 480px, centered with mx-auto
- Card aspect ratio is 3:4 via aspect-[3/4]
- isLoading=true renders BoardSkeleton with 24 Skeleton elements
- BoardSkeleton uses the same 4-column grid layout as the real board
- `npx tsc --noEmit` exits 0

---

## <threat_model>

**Phase 3 — Game Board UI**

- Card icons are rendered only after flip animation completes (icon arrives via props already flipped)
- `isLocked` prop prevents click events during evaluation — client-side guard complements server-side evaluationLock
- No sensitive data displayed on board (icons are pre-defined tech logos)
- Z-index stacking: flipped card backface is hidden, no overlap issues with grid layout
- **Risk:** Low. Purely presentational components; no network calls, no user input beyond card clicks.

</threat_model>

---

## <verification>

1. **Component renders:** `GameBoard` with 24 `MemoryCard` children renders without errors
2. **Animation:** Card flip uses motion.div rotateY(180) at 0.4s transition
3. **Matched styling:** Matched cards show violet border + ring + reduced opacity
4. **Lock state:** isLocked=true prevents onClick from firing
5. **Skeleton:** BoardSkeleton renders 24 skeleton rectangles in 4×6 grid
6. **Type check:** `npx tsc --noEmit` exits 0
7. **Build:** `npm run build` (client) exits 0

---

## <success_criteria>

- [ ] 24 cards render in a 4×6 responsive grid (BOARD-01)
- [ ] Cards flip with Framer Motion 3D rotateY animation on state change (BOARD-02)
- [ ] Matched cards have violet border/ring and stay face-up (BOARD-03)
- [ ] isLocked prop prevents card clicks (BOARD-04)
- [ ] Loading skeleton shows 24 shimmering card positions (BONUS-03)
- [ ] All components type-check and build without errors
