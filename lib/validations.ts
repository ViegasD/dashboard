import { z } from "zod";

// ── Projects ───────────────────────────────────────────────────────────────

export const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum(["backlog", "in-progress", "done"]).default("backlog"),
  tags: z.array(z.string()).default([]),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
    .optional(),
  description: z.string().optional(),
});

export const ProjectPatchSchema = ProjectCreateSchema.partial();

export const ProjectMemberAddSchema = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]),
});

export const ProjectMemberPatchSchema = z.object({
  role: z.enum(["editor", "viewer"]),
});

export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
export type ProjectPatchInput = z.infer<typeof ProjectPatchSchema>;
export type ProjectMemberAddInput = z.infer<typeof ProjectMemberAddSchema>;
export type ProjectMemberPatchInput = z.infer<typeof ProjectMemberPatchSchema>;

// ── Goals ──────────────────────────────────────────────────────────────────

export const GoalCreateSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.enum(["Work", "Personal", "Health", "Learning"]),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "targetDate must be YYYY-MM-DD")
    .optional(),
  milestones: z
    .array(z.object({ label: z.string().min(1) }))
    .default([]),
});

export const GoalPatchSchema = GoalCreateSchema.omit({ milestones: true }).partial();

export type GoalCreateInput = z.infer<typeof GoalCreateSchema>;
export type GoalPatchInput = z.infer<typeof GoalPatchSchema>;

// ── Milestones ─────────────────────────────────────────────────────────────

export const MilestonePatchSchema = z.object({
  done: z.boolean(),
});

export type MilestonePatchInput = z.infer<typeof MilestonePatchSchema>;

// ── Planned tasks ──────────────────────────────────────────────────────────

export const PlannedTaskCreateSchema = z
  .object({
    title: z.string().min(1).max(255),
    weekStart: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "weekStart must be YYYY-MM-DD (Monday)"),
    day: z.number().int().min(0).max(6),
    startHour: z.number().int().min(0).max(23),
    endHour: z.number().int().min(1).max(24),
    color: z.string().min(1),
  })
  .refine((d) => d.endHour > d.startHour, {
    message: "endHour must be greater than startHour",
    path: ["endHour"],
  });

const _plannedTaskBase = z.object({
  title: z.string().min(1).max(255),
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "weekStart must be YYYY-MM-DD (Monday)"),
  day: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
  color: z.string().min(1),
});

export const PlannedTaskPatchSchema = _plannedTaskBase
  .partial()
  .refine(
    (d) => {
      if (d.startHour !== undefined && d.endHour !== undefined) {
        return d.endHour > d.startHour;
      }
      return true;
    },
    { message: "endHour must be greater than startHour", path: ["endHour"] }
  );

export type PlannedTaskCreateInput = z.infer<typeof PlannedTaskCreateSchema>;
export type PlannedTaskPatchInput = z.infer<typeof PlannedTaskPatchSchema>;

// ── Habits ─────────────────────────────────────────────────────────────────

const VALID_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

export const HabitCreateSchema = z.object({
  title: z.string().min(1).max(255),
  days: z.array(z.number().int().min(0).max(6)).min(1),
  startHour: z.number().int().min(0).max(23).optional(),
  endHour: z.number().int().min(1).max(24).optional(),
  color: z.string().min(1).default("bg-blue-500"),
}).refine(
  (d) => {
    if (d.startHour !== undefined && d.endHour !== undefined) {
      return d.endHour > d.startHour;
    }
    return true;
  },
  { message: "endHour must be greater than startHour", path: ["endHour"] }
);

export const HabitPatchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  days: z.array(z.number().int().min(0).max(6)).min(1).optional(),
  startHour: z.number().int().min(0).max(23).nullable().optional(),
  endHour: z.number().int().min(1).max(24).nullable().optional(),
  color: z.string().min(1).optional(),
});

export const HabitLogUpsertSchema = z.object({
  habitId: z.string().min(1),
  date: VALID_DATE,
  done: z.boolean(),
});

export type HabitCreateInput = z.infer<typeof HabitCreateSchema>;
export type HabitPatchInput = z.infer<typeof HabitPatchSchema>;
export type HabitLogUpsertInput = z.infer<typeof HabitLogUpsertSchema>;
