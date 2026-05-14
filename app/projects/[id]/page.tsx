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
  ArrowLeft, Pencil, Plus, CheckCircle2, Circle, Trash2, Share2, Users, X,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type ProjectStatus = "backlog" | "in-progress" | "done";
type MyRole = "owner" | "editor" | "viewer" | null;

interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
}

interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: "editor" | "viewer";
  addedAt: string;
}

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  tags: string[];
  dueDate: string | null;
  description: string | null;
  tasks: ProjectTask[];
  myRole: MyRole;
  members: Member[];
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

function ShareSheet({
  projectId,
  members,
  onMembersChange,
}: {
  projectId: string;
  members: Member[];
  onMembersChange: (members: Member[]) => void;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [adding, setAdding] = useState(false);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    if (res.ok) {
      const member = await res.json();
      onMembersChange([...members, member]);
      setEmail("");
      toast.success(t.projects.memberAdded);
    } else {
      const data = await res.json().catch(() => null);
      if (data?.error === "not_found") toast.error(t.projects.notFound);
      else if (data?.error === "already_member") toast.error(t.projects.alreadyMember);
      else if (data?.error === "invite_yourself") toast.error(t.projects.inviteYourself);
      else toast.error("Failed to add member");
    }
    setAdding(false);
  }

  async function changeRole(userId: string, newRole: "editor" | "viewer") {
    const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      onMembersChange(members.map((m) => m.userId === userId ? { ...m, role: newRole } : m));
      toast.success(t.projects.roleChanged);
    } else {
      toast.error("Failed to update role");
    }
  }

  async function removeMember(userId: string) {
    const res = await fetch(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      onMembersChange(members.filter((m) => m.userId !== userId));
      toast.success(t.projects.memberRemoved);
    } else {
      toast.error("Failed to remove member");
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          {t.projects.shareProject}
        </SheetTitle>
      </SheetHeader>

      <form onSubmit={addMember} className="space-y-3 mt-4">
        <label className="text-sm font-medium">{t.projects.inviteByEmail}</label>
        <div className="flex gap-2">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.projects.emailPlaceholder}
            className="flex-1"
          />
          <select
            className="border rounded-md px-2 py-2 text-sm bg-background"
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
          >
            <option value="editor">{t.projects.roleEditor}</option>
            <option value="viewer">{t.projects.roleViewer}</option>
          </select>
          <Button type="submit" size="sm" disabled={adding}>
            {adding ? t.projects.adding : t.projects.addMember}
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-2">
        <p className="text-sm font-medium">{t.projects.members}</p>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-md">
            {t.projects.noMembers}
          </p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name ?? m.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <select
                  className="border rounded-md px-2 py-1 text-xs bg-background"
                  value={m.role}
                  onChange={(e) => changeRole(m.userId, e.target.value as "editor" | "viewer")}
                  aria-label={t.projects.changeRole}
                >
                  <option value="editor">{t.projects.roleEditor}</option>
                  <option value="viewer">{t.projects.roleViewer}</option>
                </select>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => removeMember(m.userId)}
                  title={t.projects.removeMember}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
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
  const [shareOpen, setShareOpen] = useState(false);
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

  function updateMembers(members: Member[]) {
    setProject((p) => p ? { ...p, members } : p);
  }

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
    } else {
      toast.error("Failed to add task");
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
    const res = await fetch(`/api/projects/${project.id}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    });
    if (!res.ok) {
      toast.error("Failed to update task");
      setProject((p) => p ? {
        ...p,
        tasks: p.tasks.map((t) => t.id === task.id ? { ...t, done: task.done } : t),
      } : p);
    }
  }

  async function deleteTask(taskId: string) {
    if (!project) return;
    const snapshot = project.tasks;
    setProject((p) => p ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p);
    const res = await fetch(`/api/projects/${project.id}/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      toast.error("Failed to delete task");
      setProject((p) => p ? { ...p, tasks: snapshot } : p);
    }
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
              {project.members.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />{project.members.length + 1}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {(project.myRole === "owner" || project.myRole === null) && (
              <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
                <Share2 className="w-4 h-4 mr-1.5" />
                {t.projects.share}
              </Button>
            )}
            {project.myRole !== "viewer" && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="w-4 h-4 mr-1.5" />
                {t.projects.detailEdit}
              </Button>
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

      {/* Share sheet */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6">
          <ShareSheet
            projectId={project.id}
            members={project.members}
            onMembersChange={updateMembers}
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
              disabled={project.myRole === "viewer"}
            />
            <Button type="submit" size="sm" disabled={adding || !newTitle.trim() || project.myRole === "viewer"}>
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
                    hidden={project.myRole === "viewer"}
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
                    hidden={project.myRole === "viewer"}
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
