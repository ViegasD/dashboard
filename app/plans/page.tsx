"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Circle, LayoutGrid, Repeat2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 7;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const SLOT_HEIGHT = 56;
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface PlannedTask {
  id: string; title: string; day: number;
  startHour: number; endHour: number; color: string;
}

interface Habit {
  id: string; title: string; days: number[];
  startHour: number | null; endHour: number | null; color: string;
}

interface HabitLog {
  id: string; habitId: string; date: string; done: boolean;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ─── Habits Tab ──────────────────────────────────────────────────────────────

function HabitsTab({ weekStart }: { weekStart: Date }) {
  const { t } = useI18n();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: "", days: [] as number[], startHour: "", endHour: "", color: "bg-blue-500",
  });

  function loadData(ws: Date) {
    Promise.all([
      fetch("/api/habits").then((r) => r.ok ? r.json() : []),
      fetch(`/api/habits/logs?weekStart=${toISODate(ws)}`).then((r) => r.ok ? r.json() : []),
    ]).then(([h, l]) => { setHabits(h); setLogs(l); });
  }

  useEffect(() => { loadData(weekStart); }, [weekStart]);

  function toggleDay(day: number) {
    setNewHabit((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  }

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    if (newHabit.days.length === 0) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      title: newHabit.title,
      days: newHabit.days,
      color: newHabit.color,
    };
    if (newHabit.startHour !== "" && newHabit.endHour !== "") {
      body.startHour = Number(newHabit.startHour);
      body.endHour = Number(newHabit.endHour);
    }
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const habit = await res.json();
      setHabits((prev) => [...prev, habit]);
      setSheetOpen(false);
      setNewHabit({ title: "", days: [], startHour: "", endHour: "", color: "bg-blue-500" });
    }
    setSaving(false);
  }

  async function deleteHabit(id: string) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  async function toggleLog(habitId: string, date: string, currentDone: boolean) {
    const done = !currentDone;
    // Optimistic
    setLogs((prev) => {
      const existing = prev.find((l) => l.habitId === habitId && l.date === date);
      if (existing) return prev.map((l) => l.habitId === habitId && l.date === date ? { ...l, done } : l);
      return [...prev, { id: "optimistic", habitId, date, done }];
    });
    const res = await fetch("/api/habits/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, date, done }),
    });
    if (res.ok) {
      const log = await res.json();
      setLogs((prev) => prev.map((l) =>
        l.habitId === habitId && l.date === date ? log : l
      ));
    }
  }

  // Build week date strings
  const weekDates = DAYS.map((_, i) => toISODate(addDays(weekStart, i)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t.habits.subtitle}</p>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> {t.habits.newHabit}
        </Button>
      </div>

      {/* New habit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto p-6">
          <SheetHeader>
            <SheetTitle>{t.habits.newHabit}</SheetTitle>
          </SheetHeader>
          <form onSubmit={createHabit} className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t.habits.titleLabel} *</label>
              <Input required value={newHabit.title} onChange={(e) => setNewHabit((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.habits.daysLabel} *</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      newHabit.days.includes(i)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {t.habits.days[DAY_KEYS[i]]}
                  </button>
                ))}
              </div>
              {newHabit.days.length === 0 && (
                <p className="text-xs text-destructive">Select at least one day</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t.habits.startHour}</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={newHabit.startHour}
                  onChange={(e) => setNewHabit((f) => ({ ...f, startHour: e.target.value, endHour: "" }))}
                >
                  <option value="">{t.habits.noHours}</option>
                  {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t.habits.endHour}</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={newHabit.endHour}
                  disabled={newHabit.startHour === ""}
                  onChange={(e) => setNewHabit((f) => ({ ...f, endHour: e.target.value }))}
                >
                  <option value="">{t.habits.noHours}</option>
                  {HOURS.filter((h) => h > Number(newHabit.startHour)).map((h) => (
                    <option key={h} value={h}>{h}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t.plans.colorLabel}</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={newHabit.color}
                onChange={(e) => setNewHabit((f) => ({ ...f, color: e.target.value }))}
              >
                <option value="bg-blue-500">{t.habits.colors.blue}</option>
                <option value="bg-green-500">{t.habits.colors.green}</option>
                <option value="bg-purple-500">{t.habits.colors.purple}</option>
                <option value="bg-orange-500">{t.habits.colors.orange}</option>
                <option value="bg-red-500">{t.habits.colors.red}</option>
                <option value="bg-pink-500">{t.habits.colors.pink}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving || newHabit.days.length === 0} className="flex-1">
                {saving ? t.habits.saving : t.habits.addHabit}
              </Button>
              <SheetClose render={<Button type="button" variant="outline">{t.habits.cancel}</Button>} />
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Weekly habit grid */}
      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 border-2 border-dashed rounded-md">
          {t.habits.noHabits}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left font-medium text-muted-foreground py-2 pr-4 min-w-36">Habit</th>
                {DAYS.map((_, i) => {
                  const d = addDays(weekStart, i);
                  const isToday = d.toDateString() === new Date().toDateString();
                  return (
                    <th key={i} className="text-center font-medium py-2 px-1 min-w-10">
                      <div className={`text-xs ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {t.habits.days[DAY_KEYS[i]]}
                      </div>
                      <div className={`text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                        isToday ? "bg-primary text-primary-foreground" : ""
                      }`}>
                        {d.getDate()}
                      </div>
                    </th>
                  );
                })}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <tr key={habit.id} className="border-t border-border/50 group">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${habit.color}`} />
                      <span className="font-medium truncate max-w-32">{habit.title}</span>
                      {habit.startHour !== null && (
                        <span className="text-xs text-muted-foreground">{habit.startHour}–{habit.endHour}</span>
                      )}
                    </div>
                  </td>
                  {DAYS.map((_, i) => {
                    const date = weekDates[i];
                    const isScheduled = habit.days.includes(i);
                    const log = logs.find((l) => l.habitId === habit.id && l.date === date);
                    const isDone = log?.done ?? false;
                    return (
                      <td key={i} className="text-center py-2 px-1">
                        {isScheduled ? (
                          <button
                            type="button"
                            onClick={() => toggleLog(habit.id, date, isDone)}
                            className="mx-auto flex items-center justify-center w-7 h-7 rounded-full hover:bg-accent transition-colors"
                            title={isDone ? t.habits.done : "Mark done"}
                          >
                            {isDone
                              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                              : <Circle className="w-5 h-5 text-muted-foreground" />}
                          </button>
                        ) : (
                          <span className="block w-5 h-px bg-border/40 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2">
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => deleteHabit(habit.id)}
                      title={t.habits.deleteHabit}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"planner" | "habits">("planner");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [calDate, setCalDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<PlannedTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", day: 0, startHour: 9, endHour: 10, color: "bg-blue-500" });

  function loadPlanner(ws: Date) {
    Promise.all([
      fetch(`/api/plans?weekStart=${toISODate(ws)}`).then((r) => r.ok ? r.json() : []),
      fetch("/api/habits").then((r) => r.ok ? r.json() : []),
      fetch(`/api/habits/logs?weekStart=${toISODate(ws)}`).then((r) => r.ok ? r.json() : []),
    ]).then(([p, h, l]) => { setTasks(p); setHabits(h); setLogs(l); });
  }

  useEffect(() => { loadPlanner(weekStart); }, [weekStart]);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = getWeekStart(new Date()).getTime() === weekStart.getTime();
  const totalHeight = HOURS.length * SLOT_HEIGHT;

  function prevWeek() { setWeekStart((d) => addDays(d, -7)); }
  function nextWeek() { setWeekStart((d) => addDays(d, 7)); }
  function goToday() {
    setWeekStart(getWeekStart(new Date()));
    setCalDate(new Date());
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTask, weekStart: toISODate(weekStart) }),
    });
    setSaving(false);
    setSheetOpen(false);
    setNewTask({ title: "", day: 0, startHour: 9, endHour: 10, color: "bg-blue-500" });
    loadPlanner(weekStart);
  }

  async function deleteTask(id: string) {
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function toggleHabitLog(habitId: string, date: string, currentDone: boolean) {
    const done = !currentDone;
    setLogs((prev) => {
      const existing = prev.find((l) => l.habitId === habitId && l.date === date);
      if (existing) return prev.map((l) => l.habitId === habitId && l.date === date ? { ...l, done } : l);
      return [...prev, { id: "optimistic", habitId, date, done }];
    });
    const res = await fetch("/api/habits/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, date, done }),
    });
    if (res.ok) {
      const log = await res.json();
      setLogs((prev) => prev.map((l) => l.habitId === habitId && l.date === date ? log : l));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.plans.title}</h1>
          <p className="text-muted-foreground">
            {tab === "planner" ? t.plans.subtitle : t.habits.subtitle}
          </p>
        </div>
        {tab === "planner" && (
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> {t.plans.newTask}
          </Button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 border rounded-md p-1 w-fit">
        <Button
          variant={tab === "planner" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setTab("planner")}
        >
          <LayoutGrid className="w-4 h-4 mr-1.5" /> {t.plans.title}
        </Button>
        <Button
          variant={tab === "habits" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setTab("habits")}
        >
          <Repeat2 className="w-4 h-4 mr-1.5" /> {t.habits.title}
        </Button>
      </div>

      {/* Habits tab */}
      {tab === "habits" && (
        <div className="flex gap-6 flex-col lg:flex-row">
          <div className="flex-1 min-w-0">
            {/* Week navigation (shared) */}
            <div className="flex items-center gap-3 mb-4">
              <Button variant="outline" size="icon" onClick={prevWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-44 text-center">
                {formatDate(weekStart)} – {formatDate(weekEnd)}
              </span>
              <Button variant="outline" size="icon" onClick={nextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              {!isCurrentWeek && (
                <Button variant="ghost" size="sm" onClick={goToday}>{t.plans.today}</Button>
              )}
            </div>
            <HabitsTab weekStart={weekStart} />
          </div>
          <Card className="lg:w-72 w-full self-start">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t.plans.calendar}</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={calDate}
                onSelect={(d) => { setCalDate(d); if (d) setWeekStart(getWeekStart(d)); }}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Planner tab */}
      {tab === "planner" && (
        <>
          {/* New task sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto p-6">
              <SheetHeader>
                <SheetTitle>{t.plans.newTask}</SheetTitle>
              </SheetHeader>
              <form onSubmit={createTask} className="space-y-4 mt-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">{t.plans.titleLabel} *</label>
                  <Input required value={newTask.title} onChange={(e) => setNewTask((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">{t.plans.dayLabel}</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={newTask.day}
                    onChange={(e) => setNewTask((f) => ({ ...f, day: Number(e.target.value) }))}
                  >
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">{t.plans.startHour}</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={newTask.startHour}
                      onChange={(e) => setNewTask((f) => ({ ...f, startHour: Number(e.target.value) }))}
                    >
                      {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">{t.plans.endHour}</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={newTask.endHour}
                      onChange={(e) => setNewTask((f) => ({ ...f, endHour: Number(e.target.value) }))}
                    >
                      {HOURS.filter((h) => h > newTask.startHour).map((h) => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">{t.plans.colorLabel}</label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={newTask.color}
                    onChange={(e) => setNewTask((f) => ({ ...f, color: e.target.value }))}
                  >
                    <option value="bg-blue-500">{t.plans.colors.blue}</option>
                    <option value="bg-green-500">{t.plans.colors.green}</option>
                    <option value="bg-purple-500">{t.plans.colors.purple}</option>
                    <option value="bg-orange-500">{t.plans.colors.orange}</option>
                    <option value="bg-red-500">{t.plans.colors.red}</option>
                    <option value="bg-pink-500">{t.plans.colors.pink}</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saving} className="flex-1">{saving ? t.plans.saving : t.plans.addTask}</Button>
                  <SheetClose render={<Button type="button" variant="outline">{t.plans.cancel}</Button>} />
                </div>
              </form>
            </SheetContent>
          </Sheet>

          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Weekly grid */}
            <div className="flex-1 space-y-4 min-w-0">
              {/* Week navigation */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={prevWeek}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-44 text-center">
                  {formatDate(weekStart)} – {formatDate(weekEnd)}
                </span>
                <Button variant="outline" size="icon" onClick={nextWeek}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {!isCurrentWeek && (
                  <Button variant="ghost" size="sm" onClick={goToday}>{t.plans.today}</Button>
                )}
              </div>

              {/* Header row */}
              <div className="flex">
                <div className="w-12 shrink-0" />
                {DAYS.map((day, i) => {
                  const dayDate = addDays(weekStart, i);
                  const isToday = dayDate.toDateString() === new Date().toDateString();
                  return (
                    <div key={day} className="flex-1 text-center pb-2">
                      <div className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {day}
                      </div>
                      <div className={`text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                        isToday ? "bg-primary text-primary-foreground" : ""
                      }`}>
                        {dayDate.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time grid */}
              <div className="flex overflow-y-auto border rounded-lg" style={{ maxHeight: "560px" }}>
                {/* Hour labels */}
                <div className="w-12 shrink-0 relative" style={{ height: totalHeight }}>
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute right-2 text-[10px] text-muted-foreground -translate-y-2"
                      style={{ top: (h - START_HOUR) * SLOT_HEIGHT }}
                    >
                      {h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {DAYS.map((day, i) => {
                  const dayDate = addDays(weekStart, i);
                  const dateStr = toISODate(dayDate);
                  const dayTasks = tasks.filter((t) => t.day === i);
                  // Habits that have hours and include this day
                  const dayHabits = habits.filter(
                    (h) => h.days.includes(i) && h.startHour !== null && h.endHour !== null
                  );

                  return (
                    <div key={day} className="flex-1 relative border-l" style={{ height: totalHeight }}>
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className="absolute inset-x-0 border-t border-border/50"
                          style={{ top: (h - START_HOUR) * SLOT_HEIGHT }}
                        />
                      ))}

                      {/* Planned tasks */}
                      {dayTasks.map((t) => {
                        const top = (t.startHour - START_HOUR) * SLOT_HEIGHT;
                        const height = (t.endHour - t.startHour) * SLOT_HEIGHT;
                        return (
                          <div
                            key={t.id}
                            className={`absolute inset-x-0.5 rounded text-white text-xs px-1.5 py-1 overflow-hidden group ${t.color}`}
                            style={{ top, height }}
                            title={t.title}
                          >
                            <div className="font-medium truncate">{t.title}</div>
                            <div className="opacity-80">{t.startHour}:00 – {t.endHour}:00</div>
                            <button
                              className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/20 rounded"
                              onClick={() => deleteTask(t.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Habit blocks */}
                      {dayHabits.map((h) => {
                        const top = (h.startHour! - START_HOUR) * SLOT_HEIGHT;
                        const height = (h.endHour! - h.startHour!) * SLOT_HEIGHT;
                        const log = logs.find((l) => l.habitId === h.id && l.date === dateStr);
                        const isDone = log?.done ?? false;
                        return (
                          <div
                            key={h.id}
                            className={`absolute rounded text-white text-xs px-1.5 py-1 overflow-hidden border-2 border-white/40 ${h.color}`}
                            style={{ top, height, left: "2px", right: "2px" }}
                            title={h.title}
                          >
                            <div className="font-medium truncate pr-5">{h.title}</div>
                            <div className="opacity-80">{h.startHour}:00 – {h.endHour}:00</div>
                            <button
                              className="absolute top-0.5 right-0.5 p-0.5 hover:bg-white/20 rounded transition-colors"
                              onClick={() => toggleHabitLog(h.id, dateStr, isDone)}
                              title={isDone ? t.habits.done : "Mark done"}
                            >
                              {isDone
                                ? <CheckCircle2 className="w-3.5 h-3.5" />
                                : <Circle className="w-3.5 h-3.5 opacity-70" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mini calendar sidebar */}
            <Card className="lg:w-72 w-full self-start">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t.plans.calendar}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <Calendar
                  mode="single"
                  selected={calDate}
                  onSelect={(d) => {
                    setCalDate(d);
                    if (d) setWeekStart(getWeekStart(d));
                  }}
                  className="rounded-md"
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}


const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_HOUR = 7;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const SLOT_HEIGHT = 56;

interface PlannedTask {
  id: string; title: string; day: number;
  startHour: number; endHour: number; color: string;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function PlansPage() {
  const { t } = useI18n();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [calDate, setCalDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<PlannedTask[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", day: 0, startHour: 9, endHour: 10, color: "bg-blue-500" });

  function loadTasks(ws: Date) {
    fetch(`/api/plans?weekStart=${toISODate(ws)}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setTasks);
  }

  useEffect(() => { loadTasks(weekStart); }, [weekStart]);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = getWeekStart(new Date()).getTime() === weekStart.getTime();
  const totalHeight = HOURS.length * SLOT_HEIGHT;

  function prevWeek() { setWeekStart((d) => addDays(d, -7)); }
  function nextWeek() { setWeekStart((d) => addDays(d, 7)); }
  function goToday() {
    setWeekStart(getWeekStart(new Date()));
    setCalDate(new Date());
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTask, weekStart: toISODate(weekStart) }),
    });
    setSaving(false);
    setSheetOpen(false);
    setNewTask({ title: "", day: 0, startHour: 9, endHour: 10, color: "bg-blue-500" });
    loadTasks(weekStart);
  }

  async function deleteTask(id: string) {
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.plans.title}</h1>
          <p className="text-muted-foreground">{t.plans.subtitle}</p>
        </div>
        <Button size="sm" onClick={() => setSheetOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> {t.plans.newTask}
        </Button>
      </div>

      {/* New task sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm overflow-y-auto p-6">
          <SheetHeader>
            <SheetTitle>{t.plans.newTask}</SheetTitle>
          </SheetHeader>
          <form onSubmit={createTask} className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t.plans.titleLabel} *</label>
              <Input required value={newTask.title} onChange={(e) => setNewTask((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t.plans.dayLabel}</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={newTask.day}
                onChange={(e) => setNewTask((f) => ({ ...f, day: Number(e.target.value) }))}
              >
                {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">{t.plans.startHour}</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={newTask.startHour}
                  onChange={(e) => setNewTask((f) => ({ ...f, startHour: Number(e.target.value) }))}
                >
                  {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">{t.plans.endHour}</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={newTask.endHour}
                  onChange={(e) => setNewTask((f) => ({ ...f, endHour: Number(e.target.value) }))}
                >
                  {HOURS.filter((h) => h > newTask.startHour).map((h) => <option key={h} value={h}>{h}:00</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t.plans.colorLabel}</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={newTask.color}
                onChange={(e) => setNewTask((f) => ({ ...f, color: e.target.value }))}
              >
                <option value="bg-blue-500">{t.plans.colors.blue}</option>
                <option value="bg-green-500">{t.plans.colors.green}</option>
                <option value="bg-purple-500">{t.plans.colors.purple}</option>
                <option value="bg-orange-500">{t.plans.colors.orange}</option>
                <option value="bg-red-500">{t.plans.colors.red}</option>
                <option value="bg-pink-500">{t.plans.colors.pink}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">{saving ? t.plans.saving : t.plans.addTask}</Button>
              <SheetClose render={<Button type="button" variant="outline">{t.plans.cancel}</Button>} />
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Weekly grid */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Week navigation */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={prevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-44 text-center">
              {formatDate(weekStart)} – {formatDate(weekEnd)}
            </span>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            {!isCurrentWeek && (
              <Button variant="ghost" size="sm" onClick={goToday}>{t.plans.today}</Button>
            )}
          </div>

          {/* Header row */}
          <div className="flex">
            <div className="w-12 shrink-0" />
            {DAYS.map((day, i) => {
              const dayDate = addDays(weekStart, i);
              const isToday = dayDate.toDateString() === new Date().toDateString();
              return (
                <div key={day} className="flex-1 text-center pb-2">
                  <div className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {day}
                  </div>
                  <div className={`text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                    isToday ? "bg-primary text-primary-foreground" : ""
                  }`}>
                    {dayDate.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="flex overflow-y-auto border rounded-lg" style={{ maxHeight: "560px" }}>
            {/* Hour labels */}
            <div className="w-12 shrink-0 relative" style={{ height: totalHeight }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 text-[10px] text-muted-foreground -translate-y-2"
                  style={{ top: (h - START_HOUR) * SLOT_HEIGHT }}
                >
                  {h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((day, i) => {
              const dayTasks = tasks.filter((t) => t.day === i);
              return (
                <div key={day} className="flex-1 relative border-l" style={{ height: totalHeight }}>
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-x-0 border-t border-border/50"
                      style={{ top: (h - START_HOUR) * SLOT_HEIGHT }}
                    />
                  ))}
                  {dayTasks.map((t) => {
                    const top = (t.startHour - START_HOUR) * SLOT_HEIGHT;
                    const height = (t.endHour - t.startHour) * SLOT_HEIGHT;
                    return (
                      <div
                        key={t.id}
                        className={`absolute inset-x-0.5 rounded text-white text-xs px-1.5 py-1 overflow-hidden group ${t.color}`}
                        style={{ top, height }}
                        title={t.title}
                      >
                        <div className="font-medium truncate">{t.title}</div>
                        <div className="opacity-80">{t.startHour}:00 – {t.endHour}:00</div>
                        <button
                          className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/20 rounded"
                          onClick={() => deleteTask(t.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mini calendar sidebar */}
        <Card className="lg:w-72 w-full self-start">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Calendar</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={calDate}
              onSelect={(d) => {
                setCalDate(d);
                if (d) setWeekStart(getWeekStart(d));
              }}
              className="rounded-md"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
