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

async function loadProject(id: string) {
  return db.project.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
}

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await ctx.params;
  const project = await loadProject(id);
  if (!project) return new Response(null, { status: 404 });

  const isOwner = project.ownerId === null || project.ownerId === userId;
  const membership = project.members.find((m) => m.userId === userId);
  if (!isOwner && !membership) return new Response(null, { status: 403 });

  const myRole = isOwner ? "owner" : membership!.role;
  const members = project.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    addedAt: m.addedAt,
  }));

  return Response.json({ ...project, status: toApiStatus(project.status), myRole, members });
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await ctx.params;
  const project = await db.project.findUnique({
    where: { id },
    include: { members: { select: { userId: true, role: true } } },
  });
  if (!project) return new Response(null, { status: 404 });

  const isOwner = project.ownerId === null || project.ownerId === userId;
  const membership = project.members.find((m) => m.userId === userId);
  const canEdit = isOwner || membership?.role === "editor";
  if (!canEdit) return new Response(null, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = ProjectPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { status, ...rest } = parsed.data;
  const updated = await db.project.update({
    where: { id },
    data: { ...rest, ...(status ? { status: toPrismaStatus(status) } : {}) },
  });
  return Response.json({ ...updated, status: toApiStatus(updated.status) });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await ctx.params;
  const project = await db.project.findUnique({ where: { id }, select: { ownerId: true } });
  if (!project) return new Response(null, { status: 404 });

  const isOwner = project.ownerId === null || project.ownerId === userId;
  if (!isOwner) return new Response(null, { status: 403 });

  await db.project.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
