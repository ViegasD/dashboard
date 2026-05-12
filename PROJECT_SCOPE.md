# Personal Dashboard — Project Scope

## Overview

A personal web dashboard to centralize projects, goals, and weekly plans in one place.
Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and **shadcn/ui**.
Currently frontend-only with mock data. No backend or auth yet.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Package manager | npm |
| Deployment target | Vercel (future) |

---

## Project Structure

```
app/
  layout.tsx           ← Root layout — wraps everything in AppShell
  page.tsx             ← /  — Dashboard (today overview)
  projects/page.tsx    ← /projects
  goals/page.tsx       ← /goals
  plans/page.tsx       ← /plans

components/
  layout/
    AppShell.tsx       ← Flex column wrapper (TopNav + main content area)
    TopNav.tsx         ← Sticky top nav with links + mobile hamburger Sheet
  ui/                  ← shadcn/ui generated components (do not edit manually)

lib/
  mock-data.ts         ← All static data: projects, goals, plannedTasks
  utils.ts             ← shadcn cn() helper
```

---

## Pages

### Dashboard `/`
- 4 summary cards: Active Projects, Avg Goal Progress, Goals Tracked, Next Deadline
- Two-column grid: Active Projects list + Goal Progress bars
- Upcoming Deadlines table

### Projects `/projects`
- Toolbar: search input, Table/Kanban toggle, "+ New" button (not yet wired)
- **Table view**: Name, Status, Tags, Due Date, Description
- **Kanban view**: 3 columns — Backlog / In Progress / Done

### Goals `/goals`
- Overall progress bar card
- Category filter tabs: All / Work / Personal / Health / Learning
- Goal cards with progress bar + collapsible milestones list

### Plans `/plans`
- Week navigation (prev/next/today)
- 7-column weekly grid with colored task chips per day
- Mini calendar sidebar (clicking a date jumps to that week)

---

## Data Model (`lib/mock-data.ts`)

```ts
Project     { id, name, status: "backlog"|"in-progress"|"done", tags, dueDate, description }
Goal        { id, title, category: "Work"|"Personal"|"Health"|"Learning", progress, targetDate, milestones[] }
Milestone   { id, label, done }
PlannedTask { id, title, day (0=Mon ... 6=Sun), color (Tailwind bg class) }
```

All data is currently static in `lib/mock-data.ts`. Replace with API calls / DB when adding a backend.

---

## Conventions

- All interactive components use `"use client"` — server components everywhere else by default
- No extra UI libraries beyond shadcn/ui + Tailwind
- Custom components go in `components/layout/` or feature-specific subfolders
- Colors use Tailwind utility classes directly (e.g. `bg-blue-100 text-blue-800` for badges)
- Mobile: top nav hamburger opens a `Sheet` from shadcn/ui

---

## Current Status

- [x] Next.js + shadcn/ui scaffolded
- [x] All 4 pages built with mock data
- [x] Responsive shell (sticky TopNav, mobile hamburger)
- [ ] CRUD (add/edit/delete projects, goals, tasks)
- [ ] Backend / database (Turso or Supabase)
- [ ] Auth (Clerk or simple password)
- [ ] Deploy to Vercel
- [ ] Dark mode toggle

---

## Suggested Next Steps

1. Wire the **"+ New"** buttons with forms (shadcn Dialog + Form)
2. Add **edit / delete** actions per item
3. Add **persistence** via Next.js API routes + Turso (SQLite) or Supabase
4. Add **auth** (Clerk recommended — single-user, minimal setup)
5. **Deploy** to Vercel
6. Dark mode toggle (next-themes)
