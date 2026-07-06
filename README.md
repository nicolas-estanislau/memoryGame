# Memory Game

A real-time multiplayer memory card game built with **Next.js**, **Socket.IO**, **Zustand**, and **Framer Motion**. Flip cards, match pairs, and beat your opponent in this classic brain teaser.

## Features

- **Real-time multiplayer** — Server-authoritative game state synced via Socket.IO
- **3D card flip animations** — Framer Motion rotateY transitions with `prefers-reduced-motion` support
- **Theme support** — Light, dark, and system theme via `next-themes`
- **Sound effects** — Web Audio API tones for flip, match, and win (with mute toggle)
- **Emoji reactions** — Floating emoji animations during gameplay
- **Spectator mode** — Late joiners watch the game in read-only mode
- **Disconnect handling** — 30-second grace period with reconnect state restoration
- **Responsive** — Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 3, shadcn/ui |
| State | Zustand |
| Real-time | Socket.IO |
| Animations | Framer Motion, canvas-confetti |
| Server | Node.js, Socket.IO, TypeScript |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
cd server && npm install && cd ..
```

### Development

Starts both the Next.js client (port 3000) and Socket.IO server (port 3001):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
memory-game/
├── src/                    # Next.js client
│   ├── app/                # App router pages
│   │   ├── page.tsx        # Landing page
│   │   ├── create/         # Create Room page
│   │   ├── join/           # Join Room page
│   │   └── game/[roomId]/  # Game page
│   ├── components/         # React components
│   │   ├── ui/             # shadcn primitives
│   │   ├── GameBoard.tsx   # 4×6 card grid
│   │   ├── MemoryCard.tsx  # 3D flip card
│   │   ├── Scoreboard.tsx  # Scores, turn, timer
│   │   ├── WinnerModal.tsx # Victory dialog
│   │   ├── WaitingRoom.tsx # Pre-game lobby
│   │   ├── Navbar.tsx      # Navigation + toggles
│   │   └── ...
│   ├── hooks/              # Custom hooks
│   │   ├── useSocket.ts    # Socket.IO singleton
│   │   ├── useGameSocket.ts # Event wiring
│   │   ├── useSound.ts     # Audio playback
│   │   └── useSoundEffects.ts # Sound triggers
│   ├── store/              # Zustand stores
│   │   ├── index.ts        # App store (socket state)
│   │   ├── gameStore.ts    # Game state
│   │   └── audioStore.ts   # Audio preferences
│   └── types/              # Shared TypeScript types
├── server/                 # Standalone Socket.IO server
│   ├── src/
│   │   ├── index.ts        # server entry + event handlers
│   │   ├── roomManager.ts  # In-memory room CRUD
│   │   └── gameEngine.ts   # Flip/match/turn logic
│   └── Dockerfile          # Railway/Render deployment
└── .planning/              # Project planning artifacts (GSD)
```

## Game Rules

- 24 cards (12 pairs) are shuffled and placed face-down in a 4×6 grid
- Players take turns flipping two cards
- If the cards match, the player scores a point and goes again
- If they don't match, the cards flip back and turn passes to the opponent
- The player with the most pairs when all cards are matched wins
- A draw is declared if both players have the same score

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | Yes | Socket.IO server URL (client-side) |
| `PORT` | No (default: 3001) | Server listen port |
| `CORS_ORIGIN` | No (default: `http://localhost:3000`) | Allowed CORS origin |

## Deployment

### Frontend (Vercel)

The Next.js app deploys to Vercel with default settings. Set `NEXT_PUBLIC_SOCKET_SERVER_URL` to your deployed server URL.

### Server (Railway/Render)

Deploy the `server/` directory. The included `Dockerfile` handles the build. Set `PORT` (Railway sets this automatically) and `CORS_ORIGIN` to your Vercel URL.

## License

MIT
