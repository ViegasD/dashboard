import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { HabitLogUpsertSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");

  if (!weekStartParam) {
    return Response.json({ error: "weekStart query param is required (YYYY-MM-DD)" }, { status: 400 });
  }

  // Build the 7 dates of the week (Mon–Sun)
  const base = new Date(weekStartParam);
  if (isNaN(base.getTime())) {
    return Response.json({ error: "Invalid weekStart date" }, { status: 400 });
  }

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const logs = await db.habitLog.findMany({ where: { date: { in: dates } } });
  return Response.json(logs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = HabitLogUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { habitId, date, done } = parsed.data;
  const log = await db.habitLog.upsert({
    where: { habitId_date: { habitId, date } },
    update: { done },
    create: { habitId, date, done },
  });
  return Response.json(log);
}
