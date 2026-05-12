import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

export async function PATCH(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { taskId } = await ctx.params;
  const body = await request.json().catch(() => null);

  try {
    const task = await db.projectTask.update({
      where: { id: taskId },
      data: {
        ...(typeof body?.done === "boolean" ? { done: body.done } : {}),
        ...(typeof body?.title === "string" ? { title: body.title.trim() } : {}),
      },
    });
    return Response.json(task);
  } catch {
    return new Response(null, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { taskId } = await ctx.params;
  try {
    await db.projectTask.delete({ where: { id: taskId } });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
