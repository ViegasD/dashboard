import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_EMAIL and SEED_PASSWORD must be set in .env");
  }

  // ── Admin user ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Admin" },
  });
  console.log(`✓ Admin user: ${email}`);

  // ── Projects ───────────────────────────────────────────────────────────────
  await db.project.deleteMany();
  await db.project.createMany({
    data: [
      { name: "Personal Dashboard",   status: "in_progress", tags: ["web", "react"],      dueDate: "2026-05-31", description: "Central hub for projects, goals and plans." },
      { name: "ComfyUI Lipsync",      status: "in_progress", tags: ["ai", "python"],      dueDate: "2026-06-15", description: "Multi-speaker lipsync node for ComfyUI." },
      { name: "N8N Automation Suite", status: "in_progress", tags: ["automation", "n8n"], dueDate: "2026-05-20", description: "Unified workflow automation for ISP support." },
      { name: "VEO3 Video Pipeline",  status: "backlog",     tags: ["ai", "video"],       dueDate: "2026-07-01", description: "Automated K-pop video generation with VEO3." },
      { name: "ClickUp Migration",    status: "done",        tags: ["productivity"],      dueDate: "2026-04-30", description: "Migrate tasks from legacy system to ClickUp." },
    ],
  });
  console.log("✓ Projects seeded");

  // ── Goals ──────────────────────────────────────────────────────────────────
  await db.milestone.deleteMany();
  await db.goal.deleteMany();

  const goalDefs = [
    {
      title: "Launch Personal Dashboard", category: "Work" as const, progress: 20, targetDate: "2026-05-31",
      milestones: [
        { label: "Design layout",   done: true  },
        { label: "Scaffold project", done: true  },
        { label: "Build all pages",  done: false },
        { label: "Deploy to Vercel", done: false },
      ],
    },
    {
      title: "Exercise 4x per week", category: "Health" as const, progress: 65, targetDate: "2026-12-31",
      milestones: [
        { label: "Build routine",         done: true  },
        { label: "3 months consistent",   done: false },
      ],
    },
    {
      title: "Complete AI/ML course", category: "Learning" as const, progress: 40, targetDate: "2026-08-01",
      milestones: [
        { label: "Finish Module 1", done: true  },
        { label: "Finish Module 2", done: true  },
        { label: "Final project",   done: false },
      ],
    },
    {
      title: "Read 12 books this year", category: "Personal" as const, progress: 33, targetDate: "2026-12-31",
      milestones: [
        { label: "4 books done",  done: true  },
        { label: "8 books done",  done: false },
        { label: "12 books done", done: false },
      ],
    },
  ];

  for (const { milestones, ...goalData } of goalDefs) {
    await db.goal.create({ data: { ...goalData, milestones: { create: milestones } } });
  }
  console.log("✓ Goals & milestones seeded");

  // ── Planned tasks ──────────────────────────────────────────────────────────
  await db.plannedTask.deleteMany();

  // Use the Monday of the current week as weekStart
  const today = new Date();
  const day = today.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() + diff);
  weekStart.setUTCHours(0, 0, 0, 0);

  await db.plannedTask.createMany({
    data: [
      { title: "Dashboard scaffolding", weekStart, day: 0, startHour: 9,  endHour: 11, color: "bg-blue-500"   },
      { title: "N8N workflow review",   weekStart, day: 0, startHour: 14, endHour: 15, color: "bg-orange-500" },
      { title: "Gym",                   weekStart, day: 1, startHour: 7,  endHour: 8,  color: "bg-green-500"  },
      { title: "AI course – Module 3",  weekStart, day: 1, startHour: 10, endHour: 12, color: "bg-purple-500" },
      { title: "Build Projects page",   weekStart, day: 2, startHour: 9,  endHour: 12, color: "bg-blue-500"   },
      { title: "Gym",                   weekStart, day: 3, startHour: 7,  endHour: 8,  color: "bg-green-500"  },
      { title: "Build Goals page",      weekStart, day: 3, startHour: 13, endHour: 15, color: "bg-blue-500"   },
      { title: "Read",                  weekStart, day: 4, startHour: 8,  endHour: 9,  color: "bg-yellow-500" },
      { title: "Deploy dashboard",      weekStart, day: 4, startHour: 15, endHour: 17, color: "bg-blue-500"   },
      { title: "Gym",                   weekStart, day: 5, startHour: 9,  endHour: 10, color: "bg-green-500"  },
      { title: "Weekly review",         weekStart, day: 6, startHour: 10, endHour: 11, color: "bg-red-500"    },
    ],
  });
  console.log("✓ Planned tasks seeded");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
