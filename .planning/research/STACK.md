# Stack Research

**Domain:** Real-time Multiplayer Web Applications / Web Games
**Researched:** 2026-07-02
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | ^15.0.0 | Frontend framework & server hosting structure | Industry-standard React framework, robust App Router, optimization out of the box, and easy Vercel deployment. |
| TypeScript | ^5.0.0 | Static typing | Prevents runtime bugs in game state data models (e.g., card matching, turn states, payload formats). |
| Tailwind CSS | ^3.4.0 (or v4 if requested) | Styling | Highly customizable utility class setup, optimal utility grouping, perfect support for dark/light mode switches. |
| Socket.IO | ^4.8.0 | Real-time bidirectional connection | Native WebSocket abstraction with fallback polling, auto-reconnection, and room management built-in. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | ^4.5.0 | Client-side state store | Lightweight alternative to Redux for global client state (mutations, active UI states, user choices, audio toggle). |
| Framer Motion | ^11.0.0 | Animations | Declarative visual animations, layout transitions, exit-animations for cards/modals. |
| shadcn/ui | latest | UI Component Library | Highly accessible radix-ui wrapper that can be styled completely via Tailwind CSS classes. |
| canvas-confetti | ^1.9.0 | Celebrate victory | Used to trigger confetti on victory modal. |
| Lucide React | latest | Icons | SVG icons for cards, theme selector, scoreboard, and general UI. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Code syntax linting | Ensures clean code patterns and consistency across front/backend codebase. |
| Prettier | Auto-formatting | Automated styling and formatting alignment. |
| Concurrently | Parallel command runner | Used to run both Next.js frontend and Standalone Socket.IO server in local development with one command. |

## Installation

```bash
# Core & UI
npm install zustand framer-motion lucide-react canvas-confetti socket.io-client
npx -y shadcn-ui@latest init
npx -y shadcn-ui@latest add dialog button dropdown-menu toast skeleton

# Dev dependencies
npm install -D typescript @types/react @types/canvas-confetti concurrently
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Zustand | Redux Toolkit | When the state transitions are excessively nested or need redux-devtools integration out-of-the-box. Zustand is simpler and faster for MVPs. |
| Socket.IO | Pusher / Ably | When absolute serverless deployment is required (no server hosting). But Pusher is costly and has vendor lock-in. |
| Standalone Node.js Socket.IO server | Custom Next.js custom server | When local development simplicity is preferred over production hosting flexibility. A custom Next.js server cannot run on Vercel serverless. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js Serverless for WebSockets | Vercel serverless functions terminate after 15-30s, closing the WebSocket connection. | Dedicated Node.js server (Railway/Render) for WebSockets. |
| Pure CSS card flips | Hard to synchronize cleanly with React render state and coordinate with keyboard access focus styles. | Framer Motion `animate` layout states. |

## Stack Patterns by Variant

**If deployed fully to serverless platform (Vercel):**
- Split project: Next.js frontend on Vercel; Socket.IO backend on Railway.
- Next.js accesses Railway URL via environment variables.

**If hosted locally:**
- Run client (next dev) on port 3000.
- Run socket server (ts-node) on port 3001.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@15.x | react@19.x | React 19 is standard for Next 15; ensure third-party libraries (Zustand, Framer Motion) are updated to support React 19. |

## Sources

- [Next.js Documentation](https://nextjs.org/docs) — App Router specs and deployment options.
- [Socket.IO Documentation](https://socket.io/docs/v4/) — Real-time connection patterns and server-authoritative structure.
- [Zustand Documentation](https://github.com/pmndrs/zustand) — React client state guidelines.

---
*Stack research for: real-time multiplayer Memory Card Game*
*Researched: 2026-07-02*
