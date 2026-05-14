import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectMemberPatchSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string; userId: string }> };

async function requireOwner(projectId: string, requestingUserId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return "not_found";
  const isOwner = project.ownerId === null || project.ownerId === requestingUserId;
  return isOwner ? "ok" : "forbidden";
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const requestingUserId = session.user!.id!;
  const { id, userId } = await ctx.params;
  const check = await requireOwner(id, requestingUserId);
  if (check === "not_found") return new Response(null, { status: 404 });
  if (check === "forbidden") return new Response(null, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = ProjectMemberPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const member = await db.projectMember.update({
      where: { projectId_userId: { projectId: id, userId } },
      data: { role: parsed.data.role },
      include: { user: { select: { name: true, email: true } } },
    });
    return Response.json({
      id: member.id,
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      addedAt: member.addedAt,
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const requestingUserId = session.user!.id!;
  const { id, userId } = await ctx.params;
  const check = await requireOwner(id, requestingUserId);
  if (check === "not_found") return new Response(null, { status: 404 });
  if (check === "forbidden") return new Response(null, { status: 403 });

  try {
    await db.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId } },
    });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
