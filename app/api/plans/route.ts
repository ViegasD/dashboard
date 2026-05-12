import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlannedTaskCreateSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");

  if (!weekStartParam) {
    return Response.json({ error: "weekStart query param is required (YYYY-MM-DD)" }, { status: 400 });
  }

  const weekStart = new Date(weekStartParam);
  if (isNaN(weekStart.getTime())) {
    return Response.json({ error: "Invalid weekStart date" }, { status: 400 });
  }

  // Ensure it's Monday (day 1)
  if (weekStart.getUTCDay() !== 1) {
    return Response.json({ error: "weekStart must be a Monday" }, { status: 400 });
  }

  const tasks = await db.plannedTask.findMany({
    where: { weekStart },
    orderBy: [{ day: "asc" }, { startHour: "asc" }],
  });

  return Response.json(tasks.map((t) => ({
    ...t,
    weekStart: t.weekStart.toISOString().split("T")[0],
  })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = PlannedTaskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const task = await db.plannedTask.create({
    data: { ...parsed.data, weekStart: new Date(parsed.data.weekStart) },
  });

  return Response.json({ ...task, weekStart: task.weekStart.toISOString().split("T")[0] }, { status: 201 });
}
