---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | next lint + tsc + prettier |
| **Config file** | `eslint.config.mjs` / `.prettierrc` / `tsconfig.json` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx next lint && npx tsc --noEmit && npx prettier --check .` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx next lint && npx tsc --noEmit && npx prettier --check .`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | INFRA-01 | — | N/A — bootstrap | lint/type | `npx tsc --noEmit && npx next lint` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | INFRA-02 | — | N/A — server setup | type | `npx tsc --noEmit --project server/tsconfig.json` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | INFRA-03 | — | N/A — tooling | manual | `npm run dev` starts both processes | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 2 | INFRA-04 | — | N/A — env vars | manual | `.env.example` contains required vars | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npm run dev` starts both servers | INFRA-03 | Requires running process | Run `npm run dev`, verify `[client]` and `[server]` prefixes appear |
| Socket.IO server accepts connection | INFRA-02 | Requires running server | Open browser console, `io("http://localhost:3001")`, emit ping, expect pong |
| Env vars present in `.env.example` | INFRA-04 | Config file existence | Verify `.env.example` has `NEXT_PUBLIC_SOCKET_SERVER_URL` and `PORT` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
