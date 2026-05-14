import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectMemberAddSchema } from "@/lib/validations";
import { randomUUID } from "crypto";

type RouteContext = { params: Promise<{ id: string }> };

async function requireOwner(projectId: string, userId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return "not_found";
  const isOwner = project.ownerId === null || project.ownerId === userId;
  return isOwner ? "ok" : "forbidden";
}

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await ctx.params;
  const check = await requireOwner(id, userId);
  if (check === "not_found") return new Response(null, { status: 404 });
  if (check === "forbidden") return new Response(null, { status: 403 });

  const members = await db.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { addedAt: "asc" },
  });

  return Response.json(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      addedAt: m.addedAt,
    }))
  );
}

export async function POST(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const userId = session.user!.id!;
  const { id } = await ctx.params;
  const check = await requireOwner(id, userId);
  if (check === "not_found") return new Response(null, { status: 404 });
  if (check === "forbidden") return new Response(null, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = ProjectMemberAddSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { email, role } = parsed.data;

  const target = await db.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
  if (!target) return Response.json({ error: "not_found" }, { status: 404 });
  if (target.id === userId) return Response.json({ error: "invite_yourself" }, { status: 400 });

  const existing = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId: id, userId: target.id } },
  });
  if (existing) return Response.json({ error: "already_member" }, { status: 409 });

  const member = await db.projectMember.create({
    data: { id: randomUUID(), projectId: id, userId: target.id, role },
    include: { user: { select: { name: true, email: true } } },
  });

  return Response.json(
    { id: member.id, userId: member.userId, name: member.user.name, email: member.user.email, role: member.role, addedAt: member.addedAt },
    { status: 201 }
  );
}
