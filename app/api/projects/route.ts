import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectCreateSchema } from "@/lib/validations";
import { ProjectStatus as PrismaStatus } from "@prisma/client";
import { randomUUID } from "crypto";

function toApiStatus(status: PrismaStatus): string {
  return status === "in_progress" ? "in-progress" : status;
}

function toPrismaStatus(status: string): PrismaStatus {
  if (status === "in-progress") return "in_progress";
  return status as PrismaStatus;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const userId = session.user!.id!;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const projects = await db.project.findMany({
    where: {
      OR: [
        { ownerId: null },
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
      ...(status ? { status: toPrismaStatus(status) } : {}),
      ...(search
        ? {
            AND: [
              {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { tags: { has: search } },
                ],
              },
            ],
          }
        : {}),
    },
    include: { members: { select: { userId: true, role: true } } },
    orderBy: { dueDate: "asc" },
  });

  return Response.json(
    projects.map(({ members, ...p }) => {
      const isOwner = p.ownerId === null || p.ownerId === userId;
      const membership = members.find((m) => m.userId === userId);
      const myRole = isOwner ? "owner" : (membership?.role ?? null);
      return {
        ...p,
        status: toApiStatus(p.status),
        membersCount: members.length,
        myRole,
      };
    })
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const userId = session.user!.id!;
  const body = await request.json().catch(() => null);
  const parsed = ProjectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { status, ...rest } = parsed.data;
  const project = await db.project.create({
    data: { ...rest, status: toPrismaStatus(status), ownerId: userId, id: randomUUID() },
  });

  return Response.json(
    { ...project, status: toApiStatus(project.status), membersCount: 0, myRole: "owner" },
    { status: 201 }
  );
}
