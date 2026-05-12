import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlannedTaskPatchSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = PlannedTaskPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { weekStart, ...rest } = parsed.data;
  try {
    const task = await db.plannedTask.update({
      where: { id },
      data: { ...rest, ...(weekStart ? { weekStart: new Date(weekStart) } : {}) },
    });
    return Response.json({ ...task, weekStart: task.weekStart.toISOString().split("T")[0] });
  } catch {
    return new Response(null, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  try {
    await db.plannedTask.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
