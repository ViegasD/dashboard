"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Repeat2 } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

interface Habit {
  id: string;
  title: string;
  days: number[];
  color: string;
}

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  done: boolean;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// JS getDay(): 0=Sun,1=Mon…6=Sat → our convention: 0=Mon…6=Sun
function todayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export function TodayHabits() {
  const { t } = useI18n();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  const today = toISODate(new Date());
  const weekStart = toISODate(getWeekStart(new Date()));
  const dayIdx = todayIndex();

  useEffect(() => {
    Promise.all([
      fetch("/api/habits").then((r) => r.ok ? r.json() : []),
      fetch(`/api/habits/logs?weekStart=${weekStart}`).then((r) => r.ok ? r.json() : []),
    ]).then(([h, l]) => {
      setHabits(h);
      setLogs(l);
      setLoaded(true);
    });
  }, [weekStart]);

  async function toggle(habit: Habit) {
    const log = logs.find((l) => l.habitId === habit.id && l.date === today);
    const done = !(log?.done ?? false);
    // Optimistic
    setLogs((prev) => {
      const existing = prev.find((l) => l.habitId === habit.id && l.date === today);
      if (existing) return prev.map((l) => l.habitId === habit.id && l.date === today ? { ...l, done } : l);
      return [...prev, { id: "optimistic", habitId: habit.id, date: today, done }];
    });
    const res = await fetch("/api/habits/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId: habit.id, date: today, done }),
    });
    if (res.ok) {
      const updated = await res.json();
      setLogs((prev) => prev.map((l) =>
        l.habitId === habit.id && l.date === today ? updated : l
      ));
    }
  }

  const todayHabits = habits.filter((h) => h.days.includes(dayIdx));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{t.habits.title}</CardTitle>
        <Link href="/plans" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Repeat2 className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {!loaded ? (
          <p className="text-sm text-muted-foreground py-4 text-center">…</p>
        ) : todayHabits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t.habits.todayEmpty}</p>
        ) : (
          todayHabits.map((habit) => {
            const log = logs.find((l) => l.habitId === habit.id && l.date === today);
            const isDone = log?.done ?? false;
            return (
              <button
                key={habit.id}
                type="button"
                onClick={() => toggle(habit)}
                className="w-full flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent transition-colors text-left"
              >
                <span className={`shrink-0 ${habit.color} w-2 h-2 rounded-full`} />
                {isDone
                  ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
                  : <Circle className="w-4 h-4 shrink-0 text-muted-foreground" />}
                <span className={`text-sm flex-1 ${isDone ? "line-through text-muted-foreground" : ""}`}>
                  {habit.title}
                </span>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
