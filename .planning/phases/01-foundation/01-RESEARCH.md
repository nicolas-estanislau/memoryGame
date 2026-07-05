# Phase 1 Research: Foundation

**Goal:** A working dual-server dev environment — Next.js 15 app with Tailwind/shadcn/Zustand running on port 3000 and a standalone Socket.IO server on port 3001, startable with a single `npm run dev` command.

**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04

---

## 1. Requirement-by-Requirement Implementation Approach

### INFRA-01: Next.js 15 (App Router) with TypeScript, Tailwind CSS, shadcn/ui, ESLint, Prettier

**Approach:**
1. Scaffold with `create-next-app@latest` — specify TypeScript, App Router, `src/` directory, ESLint, but **omit `--tailwind`** flag (we install Tailwind v3 manually for maximum shadcn/ui compatibility).
2. Install Tailwind CSS v3 manually (`tailwindcss@^3`, `postcss`, `autoprefixer`), run `npx tailwindcss init -p`.
3. Configure `tailwind.config.ts` with content paths for `./src/**/*.{ts,tsx}`.
4. Run `npx shadcn@latest init -d` (defaults flag to skip prompts). This sets up `components.json`, CSS variables in `globals.css`, `cn()` utility, and `tailwind-animate`/`tailwind-merge`/`clsx`/`class-variance-authority` dependencies.
5. Add `shadcn/ui` components immediately needed: `Button`, `Card` (for Phase 3+), `Dialog`, `DropdownMenu`, `Skeleton`, `Toast` (Sonner).
6. Install Zustand (`zustand`) and Lucide React (`lucide-react`) as client-side dependencies.
7. Install Prettier as a dev dependency with root config.
8. The default ESLint config from `create-next-app` uses the new flat config (`eslint.config.mjs`) — extend it for the `server/` directory as well.

**Key commands:**
```bash
npx create-next-app@latest . --typescript --eslint --app --src-dir --no-tailwind --import-alias "@/*"
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
npm install zustand lucide-react socket.io-client
npx shadcn@latest init -d
npx shadcn@latest add button card dialog dropdown-menu skeleton sonner
npm install -D prettier eslint-config-prettier
```

### INFRA-02: Standalone Node.js Socket.IO Server in `server/` Directory

**Approach:**
1. Create `server/` directory with its own `package.json`.
2. Install `socket.io`, `typescript`, `tsx` (TypeScript executor — faster than `ts-node`).
3. Create `server/tsconfig.json` — target ES2022, module NodeNext, outDir `dist`, rootDir `src`.
4. Create `server/src/index.ts` — Socket.IO server entry point that reads `PORT` from env (default 3001), sets up CORS for `http://localhost:3000`, and logs when listening.
5. Add `dev` script: `"dev": "tsx watch src/index.ts"`.
6. Add a health-check event handler (`connection` → `ping/pong`).

**Key commands:**
```bash
mkdir server
cd server
npm init -y
npm install socket.io
npm install -D typescript tsx @types/node
npx tsc --init
```

**Server `tsconfig.json` specifics:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### INFRA-03: Single Command `npm run dev` Starts Both Servers

**Approach:**
1. Install `concurrently` as a root dev dependency.
2. Root `package.json` scripts:
   ```json
   {
     "dev": "concurrently -n client,server -c cyan,green \"next dev -p 3000\" \"npm run dev -prefix server\"",
     "dev:client": "next dev -p 3000",
     "dev:server": "npm run dev -prefix server"
   }
   ```
3. `concurrently` prefixes each output line with `[client]` or `[server]` and color-codes them.
4. The `-p 3000` flag explicitly sets the Next.js port (avoids ambiguity).

### INFRA-04: Environment Variables with `.env.example`

**Approach:**
1. Create `.env.example` at project root with:
   ```
   # Socket.IO Server URL (used by the client to connect to the WebSocket server)
   NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001
   
   # Server Port (used by the Socket.IO server to listen on)
   PORT=3001
   ```
2. Create `.env.local` (gitignored) — Next.js auto-loads this for dev.
3. The server reads `PORT` from `process.env.PORT` (default: `3001`).
4. The client uses `process.env.NEXT_PUBLIC_SOCKET_SERVER_URL` (Next.js exposes `NEXT_PUBLIC_*` env vars to the browser).
5. Add `.env.local` to `.gitignore`.

---

## 2. Next.js 15 App Router Bootstrap Specifics

### `create-next-app` Flags
```bash
npx create-next-app@latest . --typescript --eslint --app --src-dir --no-tailwind --import-alias "@/*"
```
All flags set to avoid interactive prompts. If starting fresh in an empty directory, use `.` for current dir. If project already has files, use a temp dir and copy.

### Post `create-next-app` Structure
```
src/
  app/
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
  ...
public/
next.config.ts      # Next.js config (ESM)
package.json
tsconfig.json       # Root TypeScript config
eslint.config.mjs   # Flat ESLint config (v9+)
```

### Tailwind CSS v3 Manual Setup
After scaffold, install Tailwind v3:
```bash
npm install -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

This generates:
- `tailwind.config.ts` (or `tailwind.config.js`)
- `postcss.config.mjs`

Update `tailwind.config.ts`:
```ts
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

Replace `src/app/globals.css` content with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

> **Note on Tailwind v4:** `create-next-app@latest` defaults to Tailwind v4 when `--tailwind` is used. v4 uses `@import "tailwindcss"` instead of `@tailwind` directives and has no `tailwind.config` file. We explicitly install v3 because shadcn/ui's generated CSS variables and `tailwind.config` integration are most stable with v3. The STACK.md research confirms v3 as the recommended choice.

### shadcn/ui Init
```bash
npx shadcn@latest init -d
```
The `-d` (defaults) flag uses `--template=next --preset=nova` without prompting.

This:
- Adds `tailwind-merge`, `clsx`, `class-variance-authority`, `tailwind-animate` to dependencies
- Creates `components.json`
- Creates `src/lib/utils.ts` with `cn()` helper
- Adds CSS variables to `src/app/globals.css`
- Updates `tailwind.config.ts` with shadcn plugin

After init, add early-needed components:
```bash
npx shadcn@latest add button card dialog dropdown-menu skeleton sonner
```

---

## 3. Standalone Socket.IO Server Setup

### Directory Structure
```
server/
  src/
    index.ts          # Main entry — creates and starts the Socket.IO server
  package.json
  tsconfig.json
```

### Entry Point (`server/src/index.ts`)
```typescript
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[server] Client connected: ${socket.id}`);

  socket.on("ping", (cb) => {
    if (typeof cb === "function") cb("pong");
  });

  socket.on("disconnect", (reason) => {
    console.log(`[server] Client disconnected: ${socket.id} (${reason})`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] Socket.IO server listening on port ${PORT}`);
});
```

### Server `package.json`
```json
{
  "name": "memory-game-server",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "socket.io": "^4.8.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

### Running the Server
- Dev: `npm run dev` (from `server/`) — uses `tsx watch` for hot reload
- Production: `npm run build && npm start`

---

## 4. Shared Types Approach

### Location
Create `src/types/index.ts` (canonical home for shared types). The server accesses them via relative import `../src/types`.

### Rationale
- A separate `types/` directory at root adds complexity with tsconfig path resolution
- `src/types/index.ts` keeps types co-located with the Next.js project where they're most used
- The server can import them with `import { Card } from "../src/types"` in its tsconfig

### Types to Define
```typescript
// src/types/index.ts

export interface Card {
  id: number;          // Card position index on the board (0-23)
  icon: string;        // Icon identifier (e.g., "nextjs", "react", "typescript")
  isFlipped: boolean;  // Whether the card is currently face-up
  isMatched: boolean;  // Whether the card has been permanently matched
}

export interface Player {
  id: string;          // Socket ID (assigned on connection)
  name: string;        // Display name chosen by player
  score: number;       // Number of pairs matched
  moves: number;       // Total card flips made
  isConnected: boolean;
}

export interface Room {
  id: string;          // Room code (6-char alphanumeric)
  players: Player[];   // Array of 1-2 players
  spectators: string[];// Socket IDs of spectators
  status: "waiting" | "playing" | "finished";
  board: Card[];       // Server-side card data (icons never sent to client)
  currentTurn: string | null; // Socket ID of the player whose turn it is
  flippedCards: number[];     // Indices of currently flipped cards
  createdAt: number;   // Timestamp
}

export interface GameState {
  roomId: string;
  board: Card[];
  players: Player[];
  currentTurn: string | null;
  status: "waiting" | "playing" | "finished";
  winner: string | null;
  elapsedTime: number;
}
```

### Client Side Import
```typescript
import type { Card, Player, Room, GameState } from "@/types";
```

### Server Side Import
The server's `tsconfig.json` should include `"../src/types"` in its `include` array:
```json
{
  "include": ["src", "../src/types"]
}
```
Then import:
```typescript
import type { Card, Player, Room, GameState } from "../src/types/index.js";
```
(NodeNext module resolution requires `.js` extension for local imports.)

---

## 5. Concurrently Configuration

### Installation
```bash
npm install -D concurrently
```

### Root `package.json` Scripts
```json
{
  "scripts": {
    "dev": "concurrently -n client,server -c cyan,green \"next dev -p 3000\" \"npm run dev --prefix server\"",
    "dev:client": "next dev -p 3000",
    "dev:server": "npm run dev --prefix server"
  }
}
```

### Flag Breakdown
| Flag | Purpose |
|------|---------|
| `-n client,server` | Prefix labels for each process |
| `-c cyan,green` | Color codes for readability |
| `--prefix server` | Runs npm script in the `server/` subdirectory |
| `-p 3000` | Ensures Next.js uses port 3000 explicitly |

### Cross-Platform Note
On Windows (PowerShell), `concurrently` handles the quoting correctly. The above syntax works on all platforms.

---

## 6. Environment Variables and `.env.example`

### `.env.example`
```
# Socket.IO Server URL (used by the client to connect to the WebSocket server)
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001

# Server Port (used by the Socket.IO server to listen on)
PORT=3001

# CORS Origin (the allowed origin for the Socket.IO server)
CORS_ORIGIN=http://localhost:3000
```

### `.env.local` (for local development)
```
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001
```

### How Each Consumes
| Variable | Where Used | How |
|----------|-----------|-----|
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | Client (browser) | `process.env.NEXT_PUBLIC_SOCKET_SERVER_URL` — Next.js inlines at build time |
| `PORT` | Server | `process.env.PORT ?? "3001"` |
| `CORS_ORIGIN` | Server | `process.env.CORS_ORIGIN ?? "http://localhost:3000"` |

### `.gitignore` additions
```
.env.local
.env*.local
```

---

## 7. ESLint and Prettier Configuration

### ESLint
- `create-next-app` generates `eslint.config.mjs` (flat config, ESLint v9+).
- It includes `@eslint/eslintrc`, `@next/eslint-plugin-next`, and TypeScript ESLint.
- For the `server/` directory, create `server/eslint.config.mjs` or extend root config to include `server/` paths.
- **Recommended:** Keep a single root `eslint.config.mjs` and add `server/` to the `ignores` list in some rules, or add a separate server config.

Root `eslint.config.mjs` structure after adding server support:
```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];

export default eslintConfig;
```

### Prettier
- Create `.prettierrc` at project root for shared config across both client and server.
- Install `prettier` and optionally `eslint-config-prettier` to avoid conflicts.

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "always"
}
```

- Create `.prettierignore`:
```
node_modules
.next
dist
.env*
.planning
```

- Add to root `package.json` scripts:
```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "next lint"
  }
}
```

---

## 8. Project Folder Structure Recommendation

```
memory-game/
├── server/
│   ├── src/
│   │   └── index.ts              # Socket.IO entry point
│   ├── package.json
│   └── tsconfig.json
├── src/                           # Next.js App Router
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page (placeholder for Phase 4)
│   │   └── globals.css            # Tailwind directives + CSS variables
│   ├── components/
│   │   └── ui/                    # shadcn/ui generated components
│   ├── hooks/
│   │   └── useSocket.ts           # Socket.IO client hook (Phase 2+)
│   ├── lib/
│   │   └── utils.ts               # cn() utility (generated by shadcn)
│   ├── store/
│   │   └── index.ts               # Zustand store (Phase 2+)
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── public/
├── .env.example
├── .env.local                     # (gitignored)
├── .prettierrc
├── .prettierignore
├── .gitignore
├── components.json                # shadcn/ui config (auto-generated)
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

### Directory Purpose Summary
| Path | Purpose |
|------|---------|
| `server/` | Standalone Socket.IO server (separate deploy target) |
| `src/app/` | Next.js App Router pages and layouts |
| `src/components/ui/` | shadcn/ui component registry |
| `src/hooks/` | Custom React hooks (socket, game, theme) |
| `src/lib/` | Utility functions (`cn()`, helpers) |
| `src/store/` | Zustand client state store(s) |
| `src/types/` | Shared TypeScript interfaces + types |

---

## 9. Specific npm Packages and Versions

### Root (Client) Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | ^15.0.0 | React framework |
| `react` | ^19.0.0 | UI library (Next.js 15 peer) |
| `react-dom` | ^19.0.0 | React DOM renderer |
| `zustand` | ^4.5.0 or ^5.0.0 | Client state management |
| `lucide-react` | ^0.400.0 | Icon library |
| `socket.io-client` | ^4.8.0 | Socket.IO client library |
| `tailwind-merge` | ^2.5.0 | Tailwind class merging (shadcn peer) |
| `clsx` | ^2.1.0 | Conditional classnames (shadcn peer) |
| `class-variance-authority` | ^0.7.0 | Component variants (shadcn peer) |
| `tailwind-animate` | ^1.0.0 | Tailwind animation plugin (shadcn peer) |

### Root (Client) Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.6.0 | TypeScript compiler |
| `tailwindcss` | ^3.4.0 | Utility-first CSS framework |
| `postcss` | ^8.4.0 | CSS processor for Tailwind |
| `autoprefixer` | ^10.4.0 | CSS vendor prefixes |
| `concurrently` | ^9.0.0 | Run client + server in parallel |
| `prettier` | ^3.3.0 | Code formatter |
| `eslint-config-prettier` | ^9.1.0 | Prettier + ESLint compat |
| `@types/node` | ^22.0.0 | Node.js type definitions |
| `@types/react` | ^19.0.0 | React type definitions |
| `@types/react-dom` | ^19.0.0 | React DOM type definitions |

### Server Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `socket.io` | ^4.8.0 | Socket.IO server library |

### Server Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.6.0 | TypeScript compiler |
| `tsx` | ^4.19.0 | TypeScript execution + watch mode |
| `@types/node` | ^22.0.0 | Node.js type definitions |

> **Version pinning note:** The `^` prefix allows minor/patch updates. For Phase 1, we use `^` ranges. If a lockfile (`package-lock.json`) is committed, builds are reproducible regardless.

---

## 10. Pitfalls, Known Issues, and Version Compatibility Notes

### 10.1 Tailwind v3 vs v4 + shadcn/ui
- `create-next-app@latest` defaults to Tailwind v4 when `--tailwind` is used
- shadcn/ui (as of mid-2026) supports both v3 and v4, but v3 is more battle-tested
- **Decision:** Pin to Tailwind v3 (`tailwindcss@^3`) to avoid any compatibility surprises
- If the shadcn CLI detects Tailwind v4, it will generate CSS-variable-based config compatible with v4. Either way works, but v3 is safer.

### 10.2 React 19 + Library Compatibility
- Next.js 15 ships with React 19
- Zustand 5.x supports React 19; if using Zustand 4.x, ensure `useSyncExternalStore` shim works
- Framer Motion 11.x supports React 19
- All shadcn/ui components use Radix UI primitives which support React 19
- **No known incompatibilities** with the chosen stack

### 10.3 Socket.IO + CORS
- The Socket.IO server must explicitly allow the Next.js origin via CORS
- In dev: `origin: "http://localhost:3000"`
- In production: set via `CORS_ORIGIN` env variable
- **Failure mode:** Client silently fails to connect (no error in dev tools by default). Always add a `connect_error` handler:
  ```typescript
  socket.on("connect_error", (err) => console.error("Socket error:", err.message));
  ```

### 10.4 Port Conflicts
- If port 3000 or 3001 is already in use, the dev script will fail
- Use `-p 3000` explicitly for Next.js (avoids TurboPack's default port picking)
- Use `PORT=3001` env for server
- Add a note in README about changing ports if needed

### 10.5 TypeScript Module Resolution (Server)
- The server uses `NodeNext` module resolution, which requires `.js` extensions for local imports
- Import from shared types: `import { Card } from "../src/types/index.js"`
- This applies only to the server; Next.js uses its own bundler resolution

### 10.6 `tsx` vs `ts-node`
- `tsx` is preferred over `ts-node` for the server:
  - Significantly faster startup
  - Built-in watch mode via `tsx watch`
  - Better ESM support
  - Active maintenance (as of 2026)
- Install as dev dependency: `npm install -D tsx`

### 10.7 ESLint Flat Config
- Next.js 15 uses ESLint v9+ with flat config (`eslint.config.mjs`)
- Old `.eslintrc.*` style configs are ignored
- To extend old-style configs, use the `FlatCompat` utility (included by default in Next.js eslint config)
- For the server, either create a separate flat config or add server files to the root config

### 10.8 Windows-Specific Notes
- `concurrently` works correctly on Windows PowerShell
- Path separators in `tsconfig.json` `include` arrays should use forward slashes (Node.js handles them)
- Use `npm run dev` not `next dev` for the client (to ensure env vars are loaded)

### 10.9 Git Ignore
Ensure `.gitignore` covers:
```
node_modules/
.next/
server/dist/
.env*.local
*.tsbuildinfo
```

### 10.10 Verifying the Setup (Success Criteria Checklist)
1. `npm run dev` starts both processes — verify both `[client]` and `[server]` prefixes appear in terminal
2. Visit `http://localhost:3000` — should see default Next.js page
3. Socket.IO server logs `listening on port 3001`
4. Open browser console, run:
   ```js
   const socket = io("http://localhost:3001");
   socket.emit("ping", (res) => console.log(res));
   // Should log "pong"
   ```
5. Run `npx tsc --noEmit` — should exit with 0 (no type errors)
6. Run `npx next lint` — should exit with 0
7. Run `npx prettier --check .` — should pass

---

## Execution Order (Recommended for Plans)

| Step | Action | Output |
|------|--------|--------|
| 1 | `create-next-app` scaffold | Root project with TypeScript, ESLint, App Router, `src/` dir |
| 2 | Install Tailwind v3 + init | `tailwind.config.ts`, `postcss.config.mjs`, Tailwind directives |
| 3 | `shadcn init -d` + add components | `components.json`, `lib/utils.ts`, CSS variables, UI components |
| 4 | Install Zustand, Lucide, socket.io-client | Client deps in root `package.json` |
| 5 | Create `server/` with `package.json` + deps | Socket.IO server project |
| 6 | Create `server/src/index.ts` | Server entry point with CORS and health check |
| 7 | Create shared `src/types/index.ts` | `Card`, `Player`, `Room`, `GameState` types |
| 8 | Install `concurrently` + configure dev script | Root `package.json` scripts |
| 9 | Create `.env.example` and `.env.local` | Environment variable files |
| 10 | Add Prettier config (`.prettierrc`, `.prettierignore`) | Root-level formatter settings |
| 11 | Update `.gitignore` | Proper ignores for all generated dirs |
| 12 | Verify — run `npm run dev`, test connection, lint, format, typecheck | All success criteria pass |

---

## References
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next)
- [Tailwind CSS v3 Next.js Guide](https://tailwindcss.com/docs/guides/nextjs)
- [Socket.IO v4 Server API](https://socket.io/docs/v4/server-api/)
- [Concurrently GitHub](https://github.com/open-cli-tools/concurrently)
- [tsx GitHub](https://github.com/privatenumber/tsx)

---

*Researched: 2026-07-04*
*For execution in: Phase 1 — Foundation*
