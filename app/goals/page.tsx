"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import { ChevronDown, CheckCircle2, Circle, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type GoalCategory = "Work" | "Personal" | "Health" | "Learning";

interface Milestone { id: string; label: string; done: boolean; }
interface Goal {
  id: string; title: string; category: GoalCategory;
  progress: number; targetDate: string | null; milestones: Milestone[];
}

const categoryColors: Record<GoalCategory, string> = {
  Work: "bg-blue-100 text-blue-800",
  Personal: "bg-purple-100 text-purple-800",
  Health: "bg-green-100 text-green-800",
  Learning: "bg-orange-100 text-orange-800",
};

const categories: (GoalCategory | "All")[] = ["All", "Work", "Personal", "Health", "Learning"];

export default function GoalsPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState<GoalCategory | "All">("All");
  const [openGoals, setOpenGoals] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState({ title: "", category: "Work" as GoalCategory, targetDate: "", milestones: "" });
  const [saving, setSaving] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    const res = await fetch(`/api/goals?${params}`);
    if (res.ok) setGoals(await res.json());
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const milestones = newGoalForm.milestones
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((label) => ({ label }));
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newGoalForm.title,
        category: newGoalForm.category,
        targetDate: newGoalForm.targetDate || null,
        milestones,
      }),
    });
    setSaving(false);
    setSheetOpen(false);
    setNewGoalForm({ title: "", category: "Work", targetDate: "", milestones: "" });
    fetchGoals();
  }

  async function toggleMilestone(goalId: string, milestoneId: string, done: boolean) {
    // Optimistic update
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const milestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, done } : m
        );
        const doneCnt = milestones.filter((m) => m.done).length;
        const progress = milestones.length > 0 ? Math.round((doneCnt / milestones.length) * 100) : 0;
        return { ...g, milestones, progress };
      })
    );

    await fetch(`/api/goals/${goalId}/milestones/${milestoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  }

  function toggleGoal(id: string) {
    setOpenGoals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const overallProgress =
    goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.goals.title}</h1>
          <p className="text-muted-foreground">{goals.length} {t.goals.goalsTracked}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall progress */}
          <Card className="flex items-center gap-4 px-6 py-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{overallProgress}%</p>
              <p className="text-xs text-muted-foreground">Overall</p>
            </div>
            <div className="w-32">
              <Progress value={overallProgress} className="h-3" />
            </div>
          </Card>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> {t.goals.newGoal}
          </Button>
        </div>
      </div>

      {/* New goal sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6">
          <SheetHeader>
            <SheetTitle>{t.goals.newGoal}</SheetTitle>
          </SheetHeader>
          <form onSubmit={createGoal} className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t.goals.titleLabel} *</label>
              <Input required value={newGoalForm.title} onChange={(e) => setNewGoalForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t.goals.categoryLabel}</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={newGoalForm.category}
                onChange={(e) => setNewGoalForm((f) => ({ ...f, category: e.target.value as GoalCategory }))}
              >
                <option>Work</option>
                <option>Personal</option>
                <option>Health</option>
                <option>Learning</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t.goals.targetDateLabel}</label>
              <Input type="date" value={newGoalForm.targetDate} onChange={(e) => setNewGoalForm((f) => ({ ...f, targetDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t.goals.milestonesLabel}</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none h-28"
                value={newGoalForm.milestones}
                onChange={(e) => setNewGoalForm((f) => ({ ...f, milestones: e.target.value }))}
                placeholder="e.g.&#10;Research options&#10;Draft plan&#10;Review"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">{saving ? t.goals.creating : t.goals.create}</Button>
              <SheetClose render={<Button type="button" variant="outline">{t.goals.cancel}</Button>} />
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as GoalCategory | "All")}>
        <TabsList>
          {categories.map((c) => (
            <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Goal cards */}
      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t.goals.loading}</p>
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const isOpen = openGoals.has(g.id);
            const doneMilestones = g.milestones.filter((m) => m.done).length;
            return (
              <Collapsible key={g.id} open={isOpen} onOpenChange={() => toggleGoal(g.id)}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{g.title}</CardTitle>
                          <Badge className={categoryColors[g.category]}>{g.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {g.targetDate ? `${t.goals.target}: ${g.targetDate} · ` : ""}{doneMilestones}/{g.milestones.length} {t.goals.milestones}
                        </p>
                      </div>
                      <CollapsibleTrigger
                        render={
                          <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Progress value={g.progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium w-10 text-right">{g.progress}%</span>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 mt-3">
                        {t.goals.milestonesLabel}
                      </p>
                      <ul className="space-y-2">
                        {g.milestones.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                            onClick={() => toggleMilestone(g.id, m.id, !m.done)}
                          >
                            {m.done ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={m.done ? "line-through text-muted-foreground" : ""}>
                              {m.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
