"use server";

import OpenAI from "openai";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const SYSTEM_PROMPT = `You are a productivity assistant. The user will describe their life, work, goals, and routines.
Generate a JSON object (no markdown, raw JSON only) with this exact structure:

{
  "projects": [
    {
      "name": "string",
      "status": "backlog" | "in_progress" | "done",
      "tags": ["string"],
      "dueDate": "YYYY-MM-DD or null",
      "description": "string or null",
      "tasks": [{ "title": "string" }]
    }
  ],
  "goals": [
    {
      "title": "string",
      "category": "Work" | "Personal" | "Health" | "Learning",
      "progress": 0-100,
      "targetDate": "YYYY-MM-DD or null",
      "milestones": [{ "label": "string" }]
    }
  ],
  "habits": [
    {
      "title": "string",
      "days": [0,1,2,3,4,5,6],
      "startHour": 0-23 or null,
      "endHour": 0-23 or null,
      "color": "bg-blue-500" | "bg-green-500" | "bg-purple-500" | "bg-red-500" | "bg-yellow-500" | "bg-pink-500" | "bg-orange-500"
    }
  ]
}

Rules:
- days array: 0=Monday, 1=Tuesday, ..., 6=Sunday
- Generate realistic, actionable items based on what the user describes
- 2-5 projects, 2-5 goals, 3-6 habits is ideal
- Keep tasks/milestones concise (max 5 each)
- Today's date is ${new Date().toISOString().split("T")[0]}
- Return ONLY the JSON, no explanation, no markdown fences`;

export type SeedResult = {
  projects: number;
  goals: number;
  habits: number;
};

export async function runAiSeed(
  prompt: string
): Promise<{ data?: SeedResult; error?: string }> {
  if (!prompt.trim()) return { error: "Please describe your context first." };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: "OPENAI_API_KEY is not configured." };

  const client = new OpenAI({ apiKey });

  let raw: string;
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    raw = response.choices[0].message.content ?? "{}";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: `OpenAI error: ${msg}` };
  }

  let parsed: {
    projects?: Array<{
      name: string;
      status?: string;
      tags?: string[];
      dueDate?: string | null;
      description?: string | null;
      tasks?: Array<{ title: string }>;
    }>;
    goals?: Array<{
      title: string;
      category?: string;
      progress?: number;
      targetDate?: string | null;
      milestones?: Array<{ label: string }>;
    }>;
    habits?: Array<{
      title: string;
      days?: number[];
      startHour?: number | null;
      endHour?: number | null;
      color?: string;
    }>;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "AI returned invalid JSON. Try again." };
  }

  const validStatuses = new Set(["backlog", "in_progress", "done"]);
  const validCategories = new Set(["Work", "Personal", "Health", "Learning"]);
  const validColors = new Set([
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-orange-500",
  ]);

  let projectCount = 0;
  let goalCount = 0;
  let habitCount = 0;

  for (const p of parsed.projects ?? []) {
    if (!p.name) continue;
    const project = await db.project.create({
      data: {
        name: p.name,
        status: validStatuses.has(p.status ?? "") ? (p.status as "backlog" | "in_progress" | "done") : "backlog",
        tags: p.tags ?? [],
        dueDate: p.dueDate ?? null,
        description: p.description ?? null,
      },
    });
    for (const t of p.tasks ?? []) {
      if (t.title) await db.projectTask.create({ data: { projectId: project.id, title: t.title } });
    }
    projectCount++;
  }

  for (const g of parsed.goals ?? []) {
    if (!g.title) continue;
    const goal = await db.goal.create({
      data: {
        title: g.title,
        category: validCategories.has(g.category ?? "") ? (g.category as "Work" | "Personal" | "Health" | "Learning") : "Personal",
        progress: Math.min(100, Math.max(0, g.progress ?? 0)),
        targetDate: g.targetDate ?? null,
      },
    });
    for (const m of g.milestones ?? []) {
      if (m.label) await db.milestone.create({ data: { goalId: goal.id, label: m.label } });
    }
    goalCount++;
  }

  for (const h of parsed.habits ?? []) {
    if (!h.title) continue;
    await db.habit.create({
      data: {
        title: h.title,
        days: (h.days ?? [0, 1, 2, 3, 4]).filter((d) => d >= 0 && d <= 6),
        startHour: h.startHour ?? null,
        endHour: h.endHour ?? null,
        color: validColors.has(h.color ?? "") ? h.color! : "bg-blue-500",
      },
    });
    habitCount++;
  }

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/goals");
  revalidatePath("/plans");

  return { data: { projects: projectCount, goals: goalCount, habits: habitCount } };
}
