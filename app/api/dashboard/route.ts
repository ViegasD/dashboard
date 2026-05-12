import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return new Response(null, { status: 401 });

  const [activeProjectsCount, goalsCount, goalsAggregate, nextDeadline] =
    await Promise.all([
      db.project.count({ where: { status: "in_progress" } }),
      db.goal.count(),
      db.goal.aggregate({ _avg: { progress: true } }),
      db.project.findFirst({
        where: { NOT: { status: "done" } },
        orderBy: { dueDate: "asc" },
        select: { id: true, name: true, dueDate: true },
      }),
    ]);

  return Response.json({
    activeProjectsCount,
    goalsCount,
    avgGoalProgress: Math.round(goalsAggregate._avg.progress ?? 0),
    nextDeadline,
  });
}
