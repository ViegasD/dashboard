import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectCreateSchema } from "@/lib/validations";
import { ProjectStatus as PrismaStatus } from "@prisma/client";

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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const projects = await db.project.findMany({
    where: {
      ...(status ? { status: toPrismaStatus(status) } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { tags: { has: search } },
            ],
          }
        : {}),
    },
    orderBy: { dueDate: "asc" },
  });

  return Response.json(projects.map((p) => ({ ...p, status: toApiStatus(p.status) })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = ProjectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { status, ...rest } = parsed.data;
  const project = await db.project.create({
    data: { ...rest, status: toPrismaStatus(status) },
  });

  return Response.json({ ...project, status: toApiStatus(project.status) }, { status: 201 });
}
