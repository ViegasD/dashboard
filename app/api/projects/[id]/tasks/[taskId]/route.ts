import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

async function canEdit(projectId: string, userId: string): Promise<boolean> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true, role: true } } },
  });
  if (!project) return false;
  const isOwner = project.ownerId === null || project.ownerId === userId;
  const membership = project.members.find((m) => m.userId === userId);
  return isOwner || membership?.role === "editor";
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id, taskId } = await ctx.params;
  if (!await canEdit(id, session.user!.id!)) return new Response(null, { status: 403 });

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

  const { id, taskId } = await ctx.params;
  if (!await canEdit(id, session.user!.id!)) return new Response(null, { status: 403 });

  try {
    await db.projectTask.delete({ where: { id: taskId } });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
