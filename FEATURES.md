# Dashboard — Backend Implementation Spec

## Data Models

### Project
```ts
{
  id: string            // uuid
  name: string
  status: "backlog" | "in-progress" | "done"
  tags: string[]
  dueDate: string       // ISO 8601 date (YYYY-MM-DD)
  description: string
}
```

### Goal
```ts
{
  id: string            // uuid
  title: string
  category: "Work" | "Personal" | "Health" | "Learning"
  progress: number      // 0–100, derived or manually set
  targetDate: string    // ISO 8601 date
  milestones: Milestone[]
}
```

### Milestone
```ts
{
  id: string            // uuid
  goalId: string        // FK → Goal
  label: string
  done: boolean
}
```

### PlannedTask
```ts
{
  id: string            // uuid
  title: string
  weekStart: string     // ISO 8601 date of the Monday of the week
  day: number           // 0=Mon … 6=Sun
  startHour: number     // integer, 0–23
  endHour: number       // integer, 0–23, > startHour
  color: string         // Tailwind bg class or hex — consider an enum
}
```

---

## API Endpoints

### Projects — `GET /api/projects`
- Returns all projects.
- Query params:
  - `status` — filter by `"backlog" | "in-progress" | "done"`
  - `search` — full-text filter on `name` and `tags`
- Response: `Project[]`

### Projects — `POST /api/projects`
- Creates a new project.
- Body: `{ name, status, tags, dueDate, description }`
- Response: created `Project`

### Projects — `PATCH /api/projects/:id`
- Updates any field of a project (status, name, etc.).
- Body: partial `Project`
- Response: updated `Project`

### Projects — `DELETE /api/projects/:id`
- Deletes a project.

---

### Goals — `GET /api/goals`
- Returns all goals with their milestones.
- Query params:
  - `category` — filter by category
- Response: `Goal[]` (each includes nested `milestones[]`)

### Goals — `POST /api/goals`
- Creates a new goal.
- Body: `{ title, category, targetDate, milestones? }`
- `progress` starts at 0 or is auto-computed from milestones.
- Response: created `Goal`

### Goals — `PATCH /api/goals/:id`
- Updates `title`, `category`, `targetDate`, or `progress`.
- Response: updated `Goal`

### Goals — `DELETE /api/goals/:id`
- Deletes goal and cascades to its milestones.

### Milestones — `PATCH /api/goals/:goalId/milestones/:id`
- Toggles `done` or updates `label`.
- Side-effect: recalculate and persist `goal.progress` as `(doneMilestones / totalMilestones) * 100`.
- Response: updated `Milestone`

---

### Plans — `GET /api/plans`
- Returns planned tasks for a given week.
- Query params:
  - `weekStart` (required) — ISO date of Monday, e.g. `2026-05-11`
- Response: `PlannedTask[]`

### Plans — `POST /api/plans`
- Creates a planned task.
- Body: `{ title, weekStart, day, startHour, endHour, color }`
- Validation: `endHour > startHour`, `day` in 0–6, hours in 0–23.
- Response: created `PlannedTask`

### Plans — `PATCH /api/plans/:id`
- Updates any field (drag-and-drop repositioning, rename, etc.).
- Response: updated `PlannedTask`

### Plans — `DELETE /api/plans/:id`
- Deletes a planned task.

---

### Dashboard — `GET /api/dashboard`
- Aggregated summary for the home page.
- Response:
```ts
{
  activeProjectsCount: number       // projects where status === "in-progress"
  avgGoalProgress: number           // mean of all goal.progress values
  goalsCount: number
  nextDeadline: { id, name, dueDate } | null  // earliest non-done project
}
```

---

## Notes
- All dates stored and returned as ISO 8601 strings (`YYYY-MM-DD`).
- `PlannedTask.weekStart` anchors tasks to a specific week; the frontend derives the concrete date as `weekStart + day`.
- `Goal.progress` should be recomputed server-side on every milestone toggle rather than trusted from the client.
- `tags` on `Project` stored as an array; use a junction table or JSON column depending on the DB.
