import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { HabitPatchSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = HabitPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const habit = await db.habit.update({ where: { id }, data: parsed.data });
    return Response.json(habit);
  } catch {
    return new Response(null, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  try {
    await db.habit.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
