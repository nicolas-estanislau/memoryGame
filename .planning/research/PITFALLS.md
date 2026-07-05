# Pitfalls Research

**Domain:** Real-time Multiplayer Web Games
**Researched:** 2026-07-02
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Serverless Socket.IO Termination

**What goes wrong:**
Developers try to host a Socket.IO server within Next.js API Routes (Serverless Functions) deployed on Vercel. Sockets connect, but connections drop after 10-30 seconds, causing constant lobby disruption.

**Why it happens:**
Vercel serverless environments are stateless and terminate execution context after returning responses. They do not maintain long-lived TCP/WebSocket connections.

**How to avoid:**
Deploy the Socket.IO server as a separate standalone Node.js process on a persistent host (e.g. Railway, Render, or Fly.io).

**Warning signs:**
Client reconnect events firing continuously every few seconds, sockets timing out with 504 errors on connect.

**Phase to address:**
Phase 1 (Initialize Next.js frontend & Socket.IO server structure).

---

### Pitfall 2: Rapid Double-Click Exploit

**What goes wrong:**
A player clicks a third card while two mismatching cards are in the process of flipping back, or double-clicks the same card very quickly to match it against itself.

**Why it happens:**
The client doesn't lock user inputs while waiting for server validation or timeout transitions.

**How to avoid:**
On the client, enforce input locking (set `isProcessing = true` in store) when two cards are flipped or when waiting for a response from the server. On the server, strictly reject any moves where:
- The card clicked is already flipped/matched.
- The player clicking is not the current active turn player.
- The server is already evaluating a flip pair.

**Warning signs:**
Users can match one card by double clicking it, or flip 3+ cards at once.

**Phase to address:**
Phase 2 (Core Game Engine).

---

### Pitfall 3: Stale State / Desync on Reconnections

**What goes wrong:**
A player temporarily drops their connection (Wi-Fi drop or app goes to background on mobile). Upon reconnecting, they see a clean board or mismatched turn pointers.

**Why it happens:**
The server doesn't cache the active game session state or clean up orphaned socket bindings correctly.

**How to avoid:**
Cache the room state in the server memory mapped by `roomId`. When a player reconnects, identify them using their user session ID (assigned on room join) and send them the entire game state immediately, restoring their position in the match.

**Warning signs:**
Reconnecting players are stuck on a blank board or cannot perform moves.

**Phase to address:**
Phase 3 (Multiplayer and State Synchronization).

---

### Pitfall 4: Audio Playback Blocked by Browser Policies

**What goes wrong:**
Sounds (flip, match, win) fail to play automatically, throwing console errors.

**Why it happens:**
Modern browsers block audio playback (Autoplay Policy) until the user has interacted with the document (clicked, tapped, or typed).

**How to avoid:**
Ensure that sounds are only triggered after the user interacts (e.g., clicks "Start Game", "Join Room", or the first card flip). Provide a global mute/unmute toggle in the navbar.

**Warning signs:**
`DOMException: play() failed because the user didn't interact with the document first` in browser console.

**Phase to address:**
Phase 4 (Audio, Theme and Polishing).

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| In-memory game state on Server | Fast setup, no database needed. | If server restarts, all active matches are destroyed. | Acceptable for MVP and casual session play. Not suitable for paid tournaments. |
| Hardcoded card icons mapping | No backend database for cards. | Modifying the card pool requires a server redeploy. | Fully acceptable for a memory game with a fixed set of card designs. |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Socket.IO + Next.js Dev Server | Port collision or hot-reload reloading server sockets. | Run the server on a distinct port (e.g. 3001) in development. |
| Vercel Deployment | Hardcoding backend socket server URL. | Pass backend URL via `NEXT_PUBLIC_SOCKET_SERVER_URL` env variable. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Layout shift during animations | Cards jank or hop when flipped. | Use CSS `backface-visibility` and transform-3d properties; avoid changing card sizes/grid layout during flip animations. | Instantly on slow rendering devices. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|------|----------|------------|
| Turn switches without visual prompt | Users click cards not realizing it is the opponent's turn. | Show a prominent turn indicator ("Your Turn" vs "Opponent's Turn") with background color shifts. |

## "Looks Done But Isn't" Checklist

- [ ] **Real-time game clock:** Often goes out of sync between clients. Verify the server broadcasts ticks or syncs timestamps instead of relying on client timers.
- [ ] **Player disconnects:** Often leaves the other player waiting forever. Verify that if a player disconnects, a 30s countdown triggers, culminating in auto-win if they don't reconnect.

---
*Pitfalls research for: real-time multiplayer Memory Card Game*
*Researched: 2026-07-02*
