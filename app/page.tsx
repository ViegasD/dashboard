export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import Link from "next/link";
import { TodayHabits } from "@/components/dashboard/TodayHabits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FolderKanban, Target, CheckSquare, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
  "in-progress": "bg-blue-100 text-blue-800",
  backlog: "bg-gray-100 text-gray-700",
  done: "bg-green-100 text-green-800",
};

function toDisplay(s: string) {
  return s === "in_progress" ? "in-progress" : s;
}

export default async function DashboardPage() {
  const [activeProjects, goals, upcoming] = await Promise.all([
    db.project.findMany({
      where: { status: "in_progress" },
      include: { tasks: { select: { done: true } } },
    }),
    db.goal.findMany({ orderBy: { createdAt: "asc" } }),
    db.project.findMany({
      where: { status: { not: "done" }, dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: { tasks: { select: { done: true } } },
    }),
  ]);

  const avgGoalProgress =
    goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;

  const today = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <FolderKanban className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeProjects.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Goal Progress</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgGoalProgress}%</p>
            <Progress value={avgGoalProgress} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Goals Tracked</CardTitle>
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{goals.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next Deadline</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold truncate">{upcoming[0]?.name ?? "\u2014"}</p>
            <p className="text-sm text-muted-foreground">{upcoming[0]?.dueDate ?? ""}</p>
          </CardContent>
        </Card>
      </div>

      {/* Two-column section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeProjects.map((p) => {
              const total = p.tasks.length;
              const done = p.tasks.filter((t) => t.done).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-md p-2 -mx-2 hover:bg-accent transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        )}
                      </div>
                      <Badge className={statusColors[toDisplay(p.status)]}>{toDisplay(p.status)}</Badge>
                    </div>
                    {total > 0 && (
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                          {done}/{total}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map((g) => (
              <Link key={g.id} href="/goals" className="block rounded-md p-2 -mx-2 hover:bg-accent transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{g.title}</p>
                  <span className="text-xs text-muted-foreground">{g.progress}%</span>
                </div>
                <Progress value={g.progress} className="h-2" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <TodayHabits />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcoming.map((p) => {
                const total = p.tasks.length;
                const done = p.tasks.filter((t) => t.done).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : null;
                return (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-accent">
                    <TableCell className="font-medium">
                      <Link href={`/projects/${p.id}`} className="hover:underline">{p.name}</Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[toDisplay(p.status)]}>{toDisplay(p.status)}</Badge>
                    </TableCell>
                    <TableCell className="min-w-32">
                      {pct !== null ? (
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.dueDate}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

