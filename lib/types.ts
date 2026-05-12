// Shared TypeScript types — mirrors the Prisma schema and is used by
// both route handlers and frontend components.

export type ProjectStatus = "backlog" | "in-progress" | "done";

export type GoalCategory = "Work" | "Personal" | "Health" | "Learning";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  tags: string[];
  dueDate: string;
  description: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  label: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  progress: number;
  targetDate: string;
  milestones: Milestone[];
}

export interface PlannedTask {
  id: string;
  title: string;
  weekStart: string; // ISO date string of the Monday
  day: number;       // 0=Mon … 6=Sun
  startHour: number;
  endHour: number;
  color: string;
}

export interface DashboardSummary {
  activeProjectsCount: number;
  avgGoalProgress: number;
  goalsCount: number;
  nextDeadline: { id: string; name: string; dueDate: string } | null;
}
