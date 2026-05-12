import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MilestonePatchSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ goalId: string; id: string }> };

export async function PATCH(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { goalId, id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = MilestonePatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const [milestone] = await db.$transaction(async (tx) => {
      const updated = await tx.milestone.update({
        where: { id, goalId },
        data: parsed.data,
      });

      // Recompute goal.progress from current milestone state
      const all = await tx.milestone.findMany({ where: { goalId } });
      const done = all.filter((m) => m.done).length;
      const progress = all.length > 0 ? Math.round((done / all.length) * 100) : 0;

      await tx.goal.update({ where: { id: goalId }, data: { progress } });

      return [updated];
    });

    return Response.json(milestone);
  } catch {
    return new Response(null, { status: 404 });
  }
}
