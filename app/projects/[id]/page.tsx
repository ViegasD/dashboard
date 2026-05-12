"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import {
  ArrowLeft, Pencil, Plus, CheckCircle2, Circle, Trash2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

type ProjectStatus = "backlog" | "in-progress" | "done";

interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
}

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  tags: string[];
  dueDate: string | null;
  description: string | null;
  tasks: ProjectTask[];
}

const statusColors: Record<ProjectStatus, string> = {
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  backlog: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  done: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const EMPTY_FORM = { name: "", status: "backlog" as ProjectStatus, tags: "", dueDate: "", description: "" };

function EditProjectForm({
  project,
  onSave,
  onClose,
}: {
  project: Project;
  onSave: (updated: Project) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: project.name,
    status: project.status,
    tags: project.tags.join(", "),
    dueDate: project.dueDate ?? "",
    description: project.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        status: form.status,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || null,
        description: form.description || null,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      onSave({ ...project, ...updated });
    }
    setSaving(false);
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{t.projects.detailEdit}</SheetTitle>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t.projects.name} *</label>
          <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t.projects.statusLabel}</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
          >
            <option value="backlog">{t.projects.statusBacklog}</option>
            <option value="in-progress">{t.projects.statusInProgress}</option>
            <option value="done">{t.projects.statusDone}</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t.projects.dueDateLabel}</label>
          <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t.projects.tagsLabel}</label>
          <Input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder={t.projects.tagsPlaceholder}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t.projects.descriptionLabel}</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm bg-background resize-none h-20"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? t.projects.saving : t.projects.save}
          </Button>
          <SheetClose render={<Button type="button" variant="outline" onClick={onClose}>{t.projects.cancel}</Button>} />
        </div>
      </form>
    </>
  );
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (r.status === 404) { router.replace("/projects"); return null; }
        return r.ok ? r.json() : null;
      })
      .then((data) => { if (data) setProject(data); setLoading(false); });
  }, [id, router]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !project) return;
    setAdding(true);
    const res = await fetch(`/api/projects/${project.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (res.ok) {
      const task = await res.json();
      setProject((p) => p ? { ...p, tasks: [...p.tasks, task] } : p);
      setNewTitle("");
    }
    setAdding(false);
  }

  async function toggleTask(task: ProjectTask) {
    if (!project) return;
    const next = !task.done;
    setProject((p) => p ? {
      ...p,
      tasks: p.tasks.map((t) => t.id === task.id ? { ...t, done: next } : t),
    } : p);
    await fetch(`/api/projects/${project.id}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    });
  }

  async function deleteTask(taskId: string) {
    if (!project) return;
    setProject((p) => p ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p);
    await fetch(`/api/projects/${project.id}/tasks/${taskId}`, { method: "DELETE" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">{t.projects.loading}</p>
      </div>
    );
  }

  if (!project) return null;

  const todoTasks = project.tasks.filter((t) => !t.done);
  const doneTasks = project.tasks.filter((t) => t.done);
  const progress = project.tasks.length > 0
    ? Math.round((doneTasks.length / project.tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.projects.backToProjects}
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={statusColors[project.status]}>{project.status}</Badge>
              {project.dueDate && (
                <span className="text-sm text-muted-foreground">
                  {t.projects.dueDate}: {project.dueDate}
                </span>
              )}
              {project.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-1.5" />
            {t.projects.detailEdit}
          </Button>
        </div>

        {/* Progress bar */}
        {project.tasks.length > 0 && (
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-sm font-medium tabular-nums w-10 text-right">{progress}%</span>
            <span className="text-xs text-muted-foreground">
              {doneTasks.length}/{project.tasks.length} {t.projects.taskProgress}
            </span>
          </div>
        )}
      </div>

      {/* Edit sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6">
          <EditProjectForm
            key={project.id}
            project={project}
            onSave={(updated) => { setProject(updated); setEditOpen(false); }}
            onClose={() => setEditOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Tasks section */}
      <div className="space-y-6">
        {/* Todo group */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t.projects.todo}
              <span className="ml-2 text-xs font-normal normal-case">{todoTasks.length}</span>
            </h2>
          </div>

          {/* Add task input */}
          <form onSubmit={addTask} className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t.projects.taskPlaceholder}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={adding || !newTitle.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {todoTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
              {t.projects.noTodoTasks}
            </p>
          ) : (
            <ul className="space-y-1">
              {todoTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 group rounded-md px-3 py-2 hover:bg-accent transition-colors"
                >
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => toggleTask(task)}
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-sm">{task.title}</span>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTask(task.id)}
                    title={t.projects.deleteTask}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Done group */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t.projects.done}
            <span className="ml-2 text-xs font-normal normal-case">{doneTasks.length}</span>
          </h2>

          {doneTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-md">
              {t.projects.noDoneTasks}
            </p>
          ) : (
            <ul className="space-y-1">
              {doneTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 group rounded-md px-3 py-2 hover:bg-accent transition-colors"
                >
                  <button
                    type="button"
                    className="shrink-0 text-green-500 hover:text-muted-foreground transition-colors"
                    onClick={() => toggleTask(task)}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-sm line-through text-muted-foreground">{task.title}</span>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTask(task.id)}
                    title={t.projects.deleteTask}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
