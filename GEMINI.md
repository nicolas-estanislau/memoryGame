<!-- GSD:project-start source:PROJECT.md -->
## Project

**Multiplayer Memory Card Game**

A production-ready real-time multiplayer Memory Card Game for 2 players built with Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, Socket.IO, and Framer Motion. The application allows players to create/join rooms, play in real-time, toggle light/dark modes, view as spectators if a room is full, and experience high-quality animations and audio.

**Core Value:** Provide a seamless, server-authoritative, real-time multiplayer memory game experience with rich visuals, synchronized game state, and zero client-side cheating.

### Constraints

- **Architecture**: Next.js serverless functions cannot hold persistent WebSocket connections, so the Socket.IO server must be hosted on a separate persistent platform (Railway, Render, Fly.io).
- **Performance**: High frequency game timer updates and animations must perform smoothly on mobile, tablet, and desktop viewports.
- **Authoritative Server**: Client cannot decide whether a card is matched or switch turns; all core game state transitions must originate from the server.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
# Core & UI
# Dev dependencies
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
- Split project: Next.js frontend on Vercel; Socket.IO backend on Railway.
- Next.js accesses Railway URL via environment variables.
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
