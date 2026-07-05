---
plan: 01-03
phase: 1
type: config
wave: 2
depends_on: [01-01, 01-02]
files_modified:
  - package.json
  - .env.example
  - .env.local
  - .prettierrc
  - .prettierignore
  - .gitignore
autonomous: true
requirements: [INFRA-03, INFRA-04]
---

# Plan 01-03: Configure concurrently dev script, environment variables, and project folder structure

<objective>
Wire up the dual-server development experience: install `concurrently` and add `npm run dev` to root `package.json` to start both Next.js (port 3000) and Socket.IO server (port 3001) with a single command. Create `.env.example` documenting all required environment variables. Add Prettier configuration (`.prettierrc`, `.prettierignore`) and update `.gitignore`. Verify the full stack starts and the client can connect to the server.
</objective>

<wave_info>
wave: 2
depends_on: [01-01, 01-02]
</wave_info>

---

## Tasks

### Task 1-03-01: Install concurrently and add dev scripts to root package.json

**type:** execute

**<read_first>**
- `package.json` (root — read current state to add scripts)
- `.planning/phases/01-foundation/01-RESEARCH.md` (concurrently configuration section)
</read_first>

**<action>**
1. Install concurrently as a root dev dependency:
   ```powershell
   npm install -D concurrently
   ```
2. Read `package.json` and update the `"scripts"` field to include the following keys. Add (`"dev"`, `"dev:client"`, `"dev:server"`, `"format"`, `"format:check"`, `"lint"`). Merge with any existing scripts:
   ```json
   {
     "scripts": {
       "dev": "concurrently -n client,server -c cyan,green \"next dev -p 3000\" \"npm run dev --prefix server\"",
       "dev:client": "next dev -p 3000",
       "dev:server": "npm run dev --prefix server",
       "build": "next build",
       "start": "next start",
       "lint": "next lint",
       "format": "prettier --write .",
       "format:check": "prettier --check ."
     }
   }
   ```
   Note: preserve any existing scripts (like the auto-generated `dev`, `build`, `start`), replacing `dev` with the concurrently version.
3. Verify `concurrently` is listed in `devDependencies` in root `package.json`.
</action>

**<acceptance_criteria>**
- `devDependencies` in root `package.json` contains `"concurrently"`
- Root `package.json` `scripts` contains `"dev"` that includes both `"next dev -p 3000"` and `"npm run dev --prefix server"`
- Root `package.json` `scripts` contains `"dev:client"` with `"next dev -p 3000"`
- Root `package.json` `scripts` contains `"dev:server"` with `"npm run dev --prefix server"`
- Root `package.json` `scripts` contains `"lint"` with `"next lint"`
- Root `package.json` `scripts` contains `"format"` with `"prettier --write ."`
- `node_modules/.package-lock.json` or `node_modules/concurrently` exists
</acceptance_criteria>

---

### Task 1-03-02: Create .env.example and .env.local

**type:** execute

**<read_first>**
- `.planning/phases/01-foundation/01-RESEARCH.md` (environment variables section)
- `.gitignore` (will add `.env*.local` later — confirm current state)
</read_first>

**<action>**
1. Create `.env.example` with the following exact content:
   ```
   # Socket.IO Server URL (used by the client to connect to the WebSocket server)
   NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001

   # Server Port (used by the Socket.IO server to listen on)
   PORT=3001

   # CORS Origin (the allowed origin for the Socket.IO server)
   CORS_ORIGIN=http://localhost:3000
   ```
2. Create `.env.local` with the following content (gitignored — for local development only):
   ```
   NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001
   ```
3. Verify the files were created and contain the expected variables:
   - `.env.example` contains `NEXT_PUBLIC_SOCKET_SERVER_URL`, `PORT`, and `CORS_ORIGIN`
   - `.env.local` contains `NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001`
</action>

**<acceptance_criteria>**
- `.env.example` exists and contains `NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001`
- `.env.example` exists and contains `PORT=3001`
- `.env.example` exists and contains `CORS_ORIGIN=http://localhost:3000`
- `.env.local` exists and contains `NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001`
</acceptance_criteria>

---

### Task 1-03-03: Create Prettier configuration files

**type:** execute

**<read_first>**
- `.planning/phases/01-foundation/01-RESEARCH.md` (Prettier config section)
- `package.json` (scripts were already updated in task 1-03-01 — verify `format` and `format:check` exist)
</read_first>

**<action>**
1. Install Prettier and eslint-config-prettier as root dev dependencies:
   ```powershell
   npm install -D prettier eslint-config-prettier
   ```
2. Create `.prettierrc` at project root with the following exact content:
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
3. Create `.prettierignore` with the following exact content:
   ```
   node_modules
   .next
   dist
   .env*
   .planning
   ```
4. Wire `eslint-config-prettier` into the ESLint flat config to prevent ESLint/Prettier conflicts. Read `eslint.config.mjs` and add an import + spread of `prettier` config:
   ```powershell
   npm install -D eslint-config-prettier
   ```
   Then modify `eslint.config.mjs` to import and extend prettier:
   ```javascript
   // Add at top of file:
   import eslintConfigPrettier from "eslint-config-prettier";
   
   // Add to the eslintConfig array:
   const eslintConfig = [
     ...compat.extends("next/core-web-vitals", "next/typescript"),
     eslintConfigPrettier,  // <-- add this line
     {
       rules: {
         "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
       },
     },
   ];
   ```
5. Verify Prettier can parse its own config:
   ```powershell
   npx prettier --check .prettierrc
   ```
   Must exit with code 0.
</action>

**<acceptance_criteria>**
- `.prettierrc` exists and contains `"semi": true`
- `.prettierrc` contains `"singleQuote": false`
- `.prettierrc` contains `"trailingComma": "all"`
- `.prettierignore` exists and contains `node_modules`, `.next`, `dist`
- `npx prettier --check .prettierrc` exits 0
- `package.json` `devDependencies` contains `"prettier"`
</acceptance_criteria>

---

### Task 1-03-04: Update .gitignore

**type:** execute

**<read_first>**
- `.gitignore` (generated by create-next-app — read current content to determine what to add)
- `.planning/phases/01-foundation/01-RESEARCH.md` (gitignore section)
</read_first>

**<action>**
1. Read the current `.gitignore` file to see what's already there.
2. Ensure the following entries are present (add any that are missing):
   ```
   .env*.local
   server/dist/
   *.tsbuildinfo
   ```
3. The default `.gitignore` from create-next-app should already have `node_modules/`, `.next/`, `.env*` — but we need to ensure `.env*.local` covers all local env variants, and add `server/dist/` and `*.tsbuildinfo`.
4. Verify the additions:
   ```powershell
   Get-Content .gitignore | Select-String "server/dist/"
   Get-Content .gitignore | Select-String "\.env\*\.local"
   Get-Content .gitignore | Select-String "tsbuildinfo"
   ```
   Each should return at least one match.
</action>

**<acceptance_criteria>**
- `.gitignore` contains `server/dist/`
- `.gitignore` contains `.env*.local` (or a pattern that matches `.env.local`)
- `.gitignore` contains `*.tsbuildinfo`
</acceptance_criteria>

---

### Task 1-03-05: End-to-end verification — start both servers and test connectivity

**type:** execute

**<read_first>**
- All previously created files should be in place
- `.planning/phases/01-foundation/01-VALIDATION.md` (manual verification checklist)
</read_first>

**<action>**
1. Run the full validation suite:
   ```powershell
   npx tsc --noEmit; if ($?) { npx next lint }; if ($?) { npx prettier --check . }
   ```
   All three commands must exit with code 0.
2. In a new terminal, start both servers:
   ```powershell
   npm run dev
   ```
   Wait 10 seconds for both processes to start.
3. Verify the client responds:
   Use `curl` or `Invoke-WebRequest`:
   ```powershell
   $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing
   $response.StatusCode -eq 200
   ```
4. Test Socket.IO ping/pong via Node.js script or browser console. Create a temporary test script `test-connection.mjs`:
   ```javascript
   import { io } from "socket.io-client";
   const socket = io("http://localhost:3001");
   socket.on("connect", () => {
     socket.emit("ping", (res) => {
       console.log("Pong received:", res);
       process.exit(res === "pong" ? 0 : 1);
     });
   });
   socket.on("connect_error", (err) => {
     console.error("Connection failed:", err.message);
     process.exit(1);
   });
   ```
   Run it: `node test-connection.mjs`. Must exit 0 with "Pong received: pong" logged.
5. Clean up the test script: `Remove-Item -Force test-connection.mjs`
</action>

**<acceptance_criteria>**
- `npx tsc --noEmit` exits 0
- `npx next lint` exits 0
- `npx prettier --check .` exits 0
- `Invoke-WebRequest http://localhost:3000` returns status code 200
- Socket.IO ping/pong test returns `"pong"` and exits 0
- Terminal output shows both `[client]` and `[server]` prefix lines from `concurrently`
</acceptance_criteria>

---

### Note: Server ESLint Coverage

The `server/` directory is not linted by `npx next lint` (Next.js ESLint only targets the Next.js app). Server linting is deferred — either extend the root `eslint.config.mjs` to include `server/` paths, or add a separate lint script in `server/package.json`. This is non-blocking for Phase 1 (server has no business logic yet) and will be addressed in Phase 7 (Deployment & Accessibility) or when game logic is added in Phase 2.

---

## <threat_model>

**Phase 1 — Foundation (dev tooling / configuration)**
- No user input, authentication, or sensitive data handled — purely dev-infrastructure wiring
- `.env.example` documents defaults for local development only (localhost URLs)
- `.env*.local` files are gitignored — production secrets cannot be committed accidentally
- **Risk:** Low. No attack surface introduced by concurrently, Prettier, or env var scaffolding

</threat_model>

---

## <verification>

1. **Full lint/type/format suite:** `npx tsc --noEmit && npx next lint && npx prettier --check .` all pass
2. **Dual-server launch:** `npm run dev` starts both processes — verify `[client]` and `[server]` prefixes in output
3. **Client reachable:** `http://localhost:3000` returns 200
4. **Server health:** Socket.IO responds to ping with pong
5. **Env vars readable:** `.env.example` documents all 3 required variables
6. **Formatting:** Prettier config applies to all source files

</verification>

## <success_criteria>

- [ ] `npm run dev` starts both Next.js (port 3000) and Socket.IO server (port 3001) via `concurrently`
- [ ] Next.js app loads at `http://localhost:3000` with HTTP 200
- [ ] Socket.IO server at `http://localhost:3001` accepts a test connection and responds to ping
- [ ] `.env.example` documents `NEXT_PUBLIC_SOCKET_SERVER_URL`, `PORT`, and `CORS_ORIGIN`
- [ ] `.prettierrc` and `.prettierignore` are in place and `prettier --check .` passes
- [ ] `.gitignore` covers `server/dist/`, `.env*.local`, and `*.tsbuildinfo`
- [ ] `npx tsc --noEmit`, `npx next lint`, `npx prettier --check .` all exit 0 on a clean run

</success_criteria>
