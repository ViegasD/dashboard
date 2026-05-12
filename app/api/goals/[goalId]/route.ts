import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoalPatchSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ goalId: string }> };

export async function PATCH(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { goalId } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = GoalPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const goal = await db.goal.update({
      where: { id: goalId },
      data: parsed.data,
      include: { milestones: true },
    });
    return Response.json(goal);
  } catch {
    return new Response(null, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { goalId } = await ctx.params;
  try {
    await db.goal.delete({ where: { id: goalId } });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
