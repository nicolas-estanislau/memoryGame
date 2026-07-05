---
plan: 01-02
phase: 1
type: setup
wave: 1
depends_on: []
files_modified:
  - server/package.json
  - server/tsconfig.json
  - server/src/index.ts
  - src/types/index.ts
autonomous: true
requirements: [INFRA-02]
---

# Plan 01-02: Set up standalone Node.js Socket.IO server with TypeScript and shared types

<objective>
Create a standalone Node.js Socket.IO server in a `server/` directory with its own `package.json`, TypeScript configuration, and dev script via `tsx watch`. Define shared TypeScript types (`Card`, `Player`, `Room`, `GameState`) in `src/types/index.ts` that both client and server can import.
</objective>

<wave_info>
wave: 1
parallel_with: [01-01]
</wave_info>

---

## Tasks

### Task 1-02-01: Create server directory with package.json and install dependencies

**type:** execute

**<read_first>**
- `.planning/phases/01-foundation/01-RESEARCH.md` (standalone server section, server package.json spec)
- `.planning/research/STACK.md` (Socket.IO version info)
- Root `package.json` (to verify it exists from 01-01 — confirms project root is scaffolded)
</read_first>

**<action>**
1. Create the server directory structure:
   ```powershell
   $serverDirs = @("server", "server\src")
   foreach ($d in $serverDirs) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
   ```
2. Create `server/package.json` with the following content (use `npm init -y` then overwrite, or write directly):
   ```powershell
   cd server; npm init -y; cd ..
   ```
   Then read the generated `server/package.json` and update its contents to match below:
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
3. Install dependencies:
   ```powershell
   cd server; npm install; cd ..
   ```
</action>

**<acceptance_criteria>**
- `server/package.json` exists and contains `"name": "memory-game-server"`
- `server/package.json` `dependencies` contains `"socket.io": "^4.8.0"`
- `server/package.json` `devDependencies` contains `"tsx": "^4.19.0"`
- `server/node_modules/socket.io` directory exists
- `server/node_modules/tsx` directory exists
</acceptance_criteria>

---

### Task 1-02-02: Create server TypeScript configuration

**type:** execute

**<read_first>**
- `.planning/phases/01-foundation/01-RESEARCH.md` (server tsconfig.json spec)
- Root `tsconfig.json` (reference — server uses different module resolution)
</read_first>

**<action>**
1. Create `server/tsconfig.json` with the following exact content:
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
2. Verify the config is valid:
   ```powershell
   npx tsc --noEmit --project server/tsconfig.json
   ```
   (Will fail initially because `src/index.ts` doesn't exist yet — that's OK; we only verify the config parses correctly by checking exit code is 2 (config error) or higher, not a crash.)
</action>

**<acceptance_criteria>**
- `server/tsconfig.json` exists and contains `"module": "NodeNext"`
- `server/tsconfig.json` contains `"rootDir": "src"`
- `server/tsconfig.json` contains `"include": ["src"]`
</acceptance_criteria>

---

### Task 1-02-03: Create server entry point (src/index.ts)

**type:** execute

**<read_first>**
- `.planning/phases/01-foundation/01-RESEARCH.md` (server entry point code)
</read_first>

**<action>**
1. Create `server/src/index.ts` with the following exact content:
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
2. Verify the file compiles correctly within its own tsconfig:
   ```powershell
   npx tsc --noEmit --project server/tsconfig.json
   ```
   Must exit with code 0.
</action>

**<acceptance_criteria>**
- `server/src/index.ts` exists and contains `import { Server } from "socket.io"`
- `server/src/index.ts` contains `cors.origin: process.env.CORS_ORIGIN || "http://localhost:3000"`
- `server/src/index.ts` contains `socket.on("ping"` handler
- `npx tsc --noEmit --project server/tsconfig.json` exits 0
</acceptance_criteria>

---

### Task 1-02-04: Create shared TypeScript types

**type:** execute

**<read_first>**
- `.planning/phases/01-foundation/01-RESEARCH.md` (shared types section — exact interface definitions)
- `server/tsconfig.json` (will need to include types path)
</read_first>

**<action>**
1. Verify the `src/types/` directory exists (create if not):
   ```powershell
   New-Item -ItemType Directory -Path "src\types" -Force | Out-Null
   ```
2. Create `src/types/index.ts` with the following exact content:
   ```typescript
   export interface Card {
     id: number;
     icon: string;
     isFlipped: boolean;
     isMatched: boolean;
   }

   export interface Player {
     id: string;
     name: string;
     score: number;
     moves: number;
     isConnected: boolean;
   }

   export interface Room {
     id: string;
     players: Player[];
     spectators: string[];
     status: "waiting" | "playing" | "finished";
     board: Card[];
     currentTurn: string | null;
     flippedCards: number[];
     createdAt: number;
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
3. Update `server/tsconfig.json` to include the shared types directory. Change the `"include"` field from `["src"]` to:
   ```json
   "include": ["src", "../src/types"]
   ```
4. Verify that the root project type-checks with the new types:
   ```powershell
   npx tsc --noEmit
   ```
   Must exit with code 0.
5. Verify that the server project type-checks including the shared types:
   ```powershell
   npx tsc --noEmit --project server/tsconfig.json
   ```
   Must exit with code 0.
</action>

**<acceptance_criteria>**
- `src/types/index.ts` exists
- `src/types/index.ts` contains `export interface Card`
- `src/types/index.ts` contains `export interface Player`
- `src/types/index.ts` contains `export interface Room`
- `src/types/index.ts` contains `export interface GameState`
- `server/tsconfig.json` include array contains `"../src/types"`
- `npx tsc --noEmit` exits 0 (root types check)
- `npx tsc --noEmit --project server/tsconfig.json` exits 0 (server types check)
</acceptance_criteria>

---

## <threat_model>

**Phase 1 — Foundation (server bootstrap/setup only)**
- No user input, authentication, or sensitive data handled — server only has a ping/pong health check
- CORS is configured to allow only `http://localhost:3000` (hardcoded default; configurable via env)
- No secrets or credentials in code
- Attack surface: effectively zero — no game logic, no room management, no data storage
- **Risk:** Low. Standard npm supply-chain risk mitigated by lockfile

</threat_model>

---

## <verification>

1. **Server type check:** `npx tsc --noEmit --project server/tsconfig.json` exits 0
2. **Root type check:** `npx tsc --noEmit` exits 0 (shared types compile in client context)
3. **Server starts:** `npm run dev --prefix server` starts and logs `listening on port 3001`
4. **Socket.IO server responds to ping:** Browser console test: `io("http://localhost:3001")` emits ping → receives pong
5. **All 4 type interfaces exist:** `Card`, `Player`, `Room`, `GameState` are all defined

</verification>

## <success_criteria>

- [ ] `server/package.json` with correct dependencies installed
- [ ] `server/tsconfig.json` compiles `server/src/index.ts` without errors
- [ ] `server/src/index.ts` creates a Socket.IO server on configurable PORT (default 3001)
- [ ] Server listens on port 3001 and responds to ping/pong health check
- [ ] `src/types/index.ts` defines `Card`, `Player`, `Room`, and `GameState` interfaces
- [ ] Both client (`npx tsc --noEmit`) and server (`npx tsc --noEmit --project server/tsconfig.json`) type-check with shared types
- [ ] Server `include` field references `"../src/types"` so shared types are accessible

</success_criteria>
