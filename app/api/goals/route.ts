import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoalCreateSchema } from "@/lib/validations";
import { GoalCategory } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as GoalCategory | null;

  const goals = await db.goal.findMany({
    where: category ? { category } : undefined,
    include: { milestones: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(goals);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = GoalCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ errors: parsed.error.flatten() }, { status: 400 });
  }

  const { milestones, ...goalData } = parsed.data;
  const goal = await db.goal.create({
    data: {
      ...goalData,
      milestones: milestones.length
        ? { create: milestones }
        : undefined,
    },
    include: { milestones: true },
  });

  return Response.json(goal, { status: 201 });
}
