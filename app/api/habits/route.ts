import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { HabitCreateSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const habits = await db.habit.findMany({ orderBy: { createdAt: "asc" } });
  return Response.json(habits);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = HabitCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const habit = await db.habit.create({ data: parsed.data });
  return Response.json(habit, { status: 201 });
}
