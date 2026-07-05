---
plan: 01-01
phase: 1
type: bootstrap
wave: 1
depends_on: []
files_modified:
  - package.json
  - tsconfig.json
  - next.config.ts
  - eslint.config.mjs
  - postcss.config.mjs
  - tailwind.config.ts
  - components.json
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/globals.css
  - src/lib/utils.ts
  - src/components/ui/button.tsx
  - src/components/ui/card.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/skeleton.tsx
  - src/components/ui/sonner.tsx
autonomous: true
requirements: [INFRA-01]
---

# Plan 01-01: Bootstrap Next.js 15 with TypeScript, Tailwind CSS, shadcn/ui, ESLint, Prettier

<objective>
Scaffold a Next.js 15 App Router project with TypeScript, manually install Tailwind CSS v3 (for shadcn/ui compatibility), initialize shadcn/ui with defaults, add baseline UI components (Button, Card, Dialog, DropdownMenu, Skeleton, Sonner), and install Zustand + Lucide React + socket.io-client as client-side dependencies. The root project must compile, lint, and format without errors.
</objective>

<wave_info>
wave: 1
parallel_with: [01-02]
</wave_info>

---

## Tasks

### Task 1-01-01: Scaffold Next.js 15 with create-next-app

**type:** execute

**<read_first>**
- `.planning/research/STACK.md`
- `.planning/phases/01-foundation/01-RESEARCH.md`
- current root directory (to confirm non-empty state — .git/ and .planning/ exist)
</read_first>

**<action>**
1. Since the project root contains `.git/` and `.planning/`, `create-next-app` cannot target `.` directly (directory not empty). Scaffold in a temporary directory:
   ```powershell
   npx create-next-app@latest temp-memory-game --typescript --eslint --app --src-dir --no-tailwind --import-alias "@/*"
   ```
2. Copy all generated files from `temp-memory-game/` into the project root (`memoryGame/`):
   ```powershell
   Copy-Item -Path "temp-memory-game\*" -Destination "." -Recurse -Force
   Copy-Item -Path "temp-memory-game\.gitignore" -Destination "." -Force
   Remove-Item -Recurse -Force "temp-memory-game"
   ```
3. Verify the contents were placed correctly:
   ```powershell
   Test-Path "package.json"; Test-Path "tsconfig.json"; Test-Path "next.config.ts"; Test-Path "eslint.config.mjs"; Test-Path "src\app\layout.tsx"; Test-Path "src\app\page.tsx"
   ```
</action>

**<acceptance_criteria>**
- `package.json` exists and contains `"next": "^15` (grep for `"next"`)
- `tsconfig.json` exists and contains `"@/*": ["./src/*"]` (grep for `@/*`)
- `next.config.ts` exists
- `eslint.config.mjs` exists and contains `next/core-web-vitals` (grep for `next/core-web-vitals`)
- `src/app/layout.tsx` exists
- `src/app/page.tsx` exists
- `src/app/globals.css` exists
</acceptance_criteria>

---

### Task 1-01-02: Install and configure Tailwind CSS v3

**type:** execute

**<read_first>**
- `tailwind.config.ts` (generated after step above — read to know current state before overwriting)
- `src/app/globals.css` (generated after step above — will replace content)
- `.planning/phases/01-foundation/01-RESEARCH.md` (Tailwind v3 setup section)
</read_first>

**<action>**
1. Install Tailwind CSS v3, PostCSS, and Autoprefixer as dev dependencies:
   ```powershell
   npm install -D tailwindcss@^3 postcss autoprefixer
   ```
2. Initialize Tailwind config:
   ```powershell
   npx tailwindcss init -p
   ```
3. Overwrite `tailwind.config.ts` with:
   ```typescript
   import type { Config } from "tailwindcss";

   const config: Config = {
     content: [
       "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
       "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
       "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
     ],
     theme: { extend: {} },
     plugins: [],
   };
   export default config;
   ```
4. Replace entire content of `src/app/globals.css` with:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
5. Verify PostCSS config exists: `postcss.config.mjs` must contain `tailwindcss` (grep for `tailwindcss`)
</action>

**<acceptance_criteria>**
- `npm ls tailwindcss` shows version `3.x`
- `tailwind.config.ts` contains `content` array with `./src/app/**/*.{js,ts,jsx,tsx,mdx}`
- `src/app/globals.css` contains `@tailwind base` (first line)
- `postcss.config.mjs` exists and contains `tailwindcss`
</acceptance_criteria>

---

### Task 1-01-03: Initialize shadcn/ui and add baseline components

**type:** execute

**<read_first>**
- `tailwind.config.ts` (will be modified by shadcn init)
- `src/app/globals.css` (will be modified by shadcn init — CSS variables added)
- `.planning/phases/01-foundation/01-RESEARCH.md` (shadcn init section)
</read_first>

**<action>**
1. Run shadcn init with defaults (non-interactive):
   ```powershell
   npx shadcn@latest init -d
   ```
2. Add baseline UI components needed for current and future phases:
   ```powershell
   npx shadcn@latest add button card dialog dropdown-menu skeleton sonner
   ```
3. Verify the generated files and config:
   - `components.json` exists with `"style": "default"` and `"tailwind": { ... }` (grep for `"style": "default"`)
   - `src/lib/utils.ts` exists with `cn()` function (grep for `export function cn`)
   - `src/components/ui/button.tsx` exists
   - `src/components/ui/card.tsx` exists
   - `src/components/ui/dialog.tsx` exists
   - `src/components/ui/dropdown-menu.tsx` exists
   - `src/components/ui/skeleton.tsx` exists
   - `src/components/ui/sonner.tsx` exists
</action>

**<acceptance_criteria>**
- `components.json` exists and contains `"style": "default"`
- `src/lib/utils.ts` exists and contains `export function cn(`
- All 6 component files exist under `src/components/ui/`: `button.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `skeleton.tsx`, `sonner.tsx`
- `src/app/globals.css` contains `:root` CSS variable block (shadcn generated)
- `tailwind.config.ts` contains `tailwindcss-animate` plugin
</acceptance_criteria>

---

### Task 1-01-04: Install client-side application dependencies

**type:** execute

**<read_first>**
- `package.json` (to verify before and after)
- `.planning/phases/01-foundation/01-RESEARCH.md` (dependencies section)
</read_first>

**<action>**
1. Install Zustand, Lucide React, and Socket.IO client as runtime dependencies:
   ```powershell
   npm install zustand lucide-react socket.io-client
   ```
2. Verify they appear in `package.json` under `"dependencies"` (not `"devDependencies"`):
   - Check for `"zustand"`, `"lucide-react"`, `"socket.io-client"` in `dependencies`
</action>

**<acceptance_criteria>**
- `package.json` `dependencies` contains `"zustand"` with version `^4` or `^5`
- `package.json` `dependencies` contains `"lucide-react"`
- `package.json` `dependencies` contains `"socket.io-client"`
- `node_modules/zustand` directory exists
- `node_modules/lucide-react` directory exists
- `node_modules/socket.io-client` directory exists
</acceptance_criteria>

---

### Task 1-01-05: Create placeholder directories and verify TypeScript compilation

**type:** execute

**<read_first>**
- `src/app/page.tsx` (current default page to confirm it renders)
- `tsconfig.json` (to confirm paths are set)
</read_first>

**<action>**
1. Create placeholder directories for future code:
   ```powershell
   $dirs = @("src\hooks", "src\store")
   foreach ($d in $dirs) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
   ```
2. Create a minimal placeholder for `src/hooks/useSocket.ts`:
   ```typescript
   import { io, Socket } from "socket.io-client";

   const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001";

   let socket: Socket | null = null;

   export function getSocket(): Socket {
     if (!socket) {
       socket = io(SOCKET_URL, { autoConnect: false });
     }
     return socket;
   }
   ```
3. Create a minimal placeholder for `src/store/index.ts`:
   ```typescript
   import { create } from "zustand";

   interface AppState {
     socketConnected: boolean;
     setSocketConnected: (connected: boolean) => void;
   }

   export const useAppStore = create<AppState>((set) => ({
     socketConnected: false,
     setSocketConnected: (connected) => set({ socketConnected: connected }),
   }));
   ```
4. Run TypeScript type check to confirm all code compiles:
   ```powershell
   npx tsc --noEmit
   ```
   Must exit with code 0.
</action>

**<acceptance_criteria>**
- `src/hooks/useSocket.ts` exists and contains `export function getSocket(`
- `src/store/index.ts` exists and contains `export const useAppStore`
- `npx tsc --noEmit` exits with code 0
</acceptance_criteria>

---

## <threat_model>

**Phase 1 — Foundation (bootstrap/setup only)**
- No user input, authentication, or sensitive data handled in this phase
- No secrets committed: all env var values in code are defaults (`localhost` URLs)
- `socket.io-client` connection URL comes from `NEXT_PUBLIC_*` env var (safe for client exposure)
- Attack surface: effectively zero — this phase creates no user-facing features
- **Risk:** Low. Standard npm supply-chain risk mitigated by lockfile (`package-lock.json`)

</threat_model>

---

## <verification>

1. **Type check:** `npx tsc --noEmit` must exit 0
2. **Lint:** `npx next lint` must exit 0
3. **Format check:** Prettier must pass (will be configured in 01-03; skip until then)
4. **File structure:** All expected shadcn components exist in `src/components/ui/`
5. **Next.js page renders:** `src/app/page.tsx` must export a valid React component

</verification>

## <success_criteria>

- [ ] `npx tsc --noEmit` exits 0 with no errors
- [ ] `npx next lint` exits 0 with no errors
- [ ] `src/app/page.tsx` renders a valid React component (no syntax errors)
- [ ] `src/lib/utils.ts` exports `cn()` utility
- [ ] 6 shadcn/ui components installed and importable
- [ ] Zustand, Lucide, socket.io-client listed in `package.json` dependencies
- [ ] `src/hooks/useSocket.ts` placeholder created
- [ ] `src/store/index.ts` placeholder created

</success_criteria>
