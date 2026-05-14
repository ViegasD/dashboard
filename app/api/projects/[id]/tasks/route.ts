import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

async function getAccess(projectId: string, userId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true, role: true } } },
  });
  if (!project) return null;
  const isOwner = project.ownerId === null || project.ownerId === userId;
  const membership = project.members.find((m) => m.userId === userId);
  return { isOwner, membership, canEdit: isOwner || membership?.role === "editor" };
}

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await ctx.params;
  const access = await getAccess(id, userId);
  if (!access) return new Response(null, { status: 404 });
  if (!access.isOwner && !access.membership) return new Response(null, { status: 403 });

  const tasks = await db.projectTask.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(tasks);
}

export async function POST(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await ctx.params;
  const access = await getAccess(id, userId);
  if (!access) return new Response(null, { status: 404 });
  if (!access.canEdit) return new Response(null, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.title || typeof body.title !== "string" || !body.title.trim()) {
    return Response.json({ error: "title required" }, { status: 400 });
  }

  const task = await db.projectTask.create({
    data: { projectId: id, title: body.title.trim() },
  });
  return Response.json(task, { status: 201 });
}
