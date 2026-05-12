export type ProjectStatus = "backlog" | "in-progress" | "done";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  tags: string[];
  dueDate: string;
  description: string;
}

export type GoalCategory = "Work" | "Personal" | "Health" | "Learning";

export interface Milestone {
  id: string;
  label: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  progress: number; // 0-100
  targetDate: string;
  milestones: Milestone[];
}

export interface PlannedTask {
  id: string;
  title: string;
  day: number; // 0=Mon ... 6=Sun
  startHour: number; // e.g. 9 = 9:00
  endHour: number;   // e.g. 10 = 10:00
  color: string;
}

// ── Projects ──────────────────────────────────────────────────────────────────
export const projects: Project[] = [
  {
    id: "p1",
    name: "Personal Dashboard",
    status: "in-progress",
    tags: ["web", "react"],
    dueDate: "2026-05-31",
    description: "Central hub for projects, goals and plans.",
  },
  {
    id: "p2",
    name: "ComfyUI Lipsync",
    status: "in-progress",
    tags: ["ai", "python"],
    dueDate: "2026-06-15",
    description: "Multi-speaker lipsync node for ComfyUI.",
  },
  {
    id: "p3",
    name: "N8N Automation Suite",
    status: "in-progress",
    tags: ["automation", "n8n"],
    dueDate: "2026-05-20",
    description: "Unified workflow automation for ISP support.",
  },
  {
    id: "p4",
    name: "VEO3 Video Pipeline",
    status: "backlog",
    tags: ["ai", "video"],
    dueDate: "2026-07-01",
    description: "Automated K-pop video generation with VEO3.",
  },
  {
    id: "p5",
    name: "ClickUp Migration",
    status: "done",
    tags: ["productivity"],
    dueDate: "2026-04-30",
    description: "Migrate tasks from legacy system to ClickUp.",
  },
];

// ── Goals ─────────────────────────────────────────────────────────────────────
export const goals: Goal[] = [
  {
    id: "g1",
    title: "Launch Personal Dashboard",
    category: "Work",
    progress: 20,
    targetDate: "2026-05-31",
    milestones: [
      { id: "m1", label: "Design layout", done: true },
      { id: "m2", label: "Scaffold project", done: true },
      { id: "m3", label: "Build all pages", done: false },
      { id: "m4", label: "Deploy to Vercel", done: false },
    ],
  },
  {
    id: "g2",
    title: "Exercise 4x per week",
    category: "Health",
    progress: 65,
    targetDate: "2026-12-31",
    milestones: [
      { id: "m5", label: "Build routine", done: true },
      { id: "m6", label: "3 months consistent", done: false },
    ],
  },
  {
    id: "g3",
    title: "Complete AI/ML course",
    category: "Learning",
    progress: 40,
    targetDate: "2026-08-01",
    milestones: [
      { id: "m7", label: "Finish Module 1", done: true },
      { id: "m8", label: "Finish Module 2", done: true },
      { id: "m9", label: "Final project", done: false },
    ],
  },
  {
    id: "g4",
    title: "Read 12 books this year",
    category: "Personal",
    progress: 33,
    targetDate: "2026-12-31",
    milestones: [
      { id: "m10", label: "4 books done", done: true },
      { id: "m11", label: "8 books done", done: false },
      { id: "m12", label: "12 books done", done: false },
    ],
  },
];

// ── Planned tasks for current week ────────────────────────────────────────────
export const plannedTasks: PlannedTask[] = [
  { id: "t1",  title: "Dashboard scaffolding", day: 0, startHour: 9,  endHour: 11, color: "bg-blue-500" },
  { id: "t2",  title: "N8N workflow review",   day: 0, startHour: 14, endHour: 15, color: "bg-orange-500" },
  { id: "t3",  title: "Gym",                   day: 1, startHour: 7,  endHour: 8,  color: "bg-green-500" },
  { id: "t4",  title: "AI course – Module 3",  day: 1, startHour: 10, endHour: 12, color: "bg-purple-500" },
  { id: "t5",  title: "Build Projects page",   day: 2, startHour: 9,  endHour: 12, color: "bg-blue-500" },
  { id: "t6",  title: "Gym",                   day: 3, startHour: 7,  endHour: 8,  color: "bg-green-500" },
  { id: "t7",  title: "Build Goals page",      day: 3, startHour: 13, endHour: 15, color: "bg-blue-500" },
  { id: "t8",  title: "Read",                  day: 4, startHour: 8,  endHour: 9,  color: "bg-yellow-500" },
  { id: "t9",  title: "Deploy dashboard",      day: 4, startHour: 15, endHour: 17, color: "bg-blue-500" },
  { id: "t10", title: "Gym",                   day: 5, startHour: 9,  endHour: 10, color: "bg-green-500" },
  { id: "t11", title: "Weekly review",         day: 6, startHour: 10, endHour: 11, color: "bg-red-500" },
];
