import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  const tasks = await db.projectTask.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(tasks);
}

export async function POST(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body?.title || typeof body.title !== "string" || !body.title.trim()) {
    return Response.json({ error: "title required" }, { status: 400 });
  }

  const task = await db.projectTask.create({
    data: { projectId: id, title: body.title.trim() },
  });
  return Response.json(task, { status: 201 });
}
