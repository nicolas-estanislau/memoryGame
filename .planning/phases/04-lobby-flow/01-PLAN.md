---
plan: 04-01
phase: 4
type: feature
wave: 1
depends_on: []
files_modified:
  - src/app/page.tsx
  - src/components/Navbar.tsx
autonomous: true
requirements: [ROOM-01]
---

# Plan 04-01: Landing Page and Navbar

**Objective:** Replace the boilerplate landing page with a Memory Game hero section and Create/Join CTAs. Add a Navbar component for cross-page navigation.

## Tasks

### Task 4-01-01: Create Navbar component

Create `src/components/Navbar.tsx` with app title/logo on left and nav links on right.

### Task 4-01-02: Replace landing page

Rewrite `src/app/page.tsx` with hero title, subtitle, and two CTA buttons linking to `/create` and `/join`.
