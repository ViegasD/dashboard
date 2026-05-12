import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectPatchSchema } from "@/lib/validations";
import { ProjectStatus as PrismaStatus } from "@prisma/client";

function toApiStatus(status: PrismaStatus): string {
  return status === "in_progress" ? "in-progress" : status;
}

function toPrismaStatus(status: string): PrismaStatus {
  if (status === "in-progress") return "in_progress";
  return status as PrismaStatus;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  const project = await db.project.findUnique({
    where: { id },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
  });
  if (!project) return new Response(null, { status: 404 });
  return Response.json({ ...project, status: toApiStatus(project.status) });
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const parsed = ProjectPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { status, ...rest } = parsed.data;
  try {
    const project = await db.project.update({
      where: { id },
      data: { ...rest, ...(status ? { status: toPrismaStatus(status) } : {}) },
    });
    return Response.json({ ...project, status: toApiStatus(project.status) });
  } catch {
    return new Response(null, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { id } = await ctx.params;
  try {
    await db.project.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
