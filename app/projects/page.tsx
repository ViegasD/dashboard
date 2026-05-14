"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import { LayoutList, Kanban, Search, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type ProjectStatus = "backlog" | "in-progress" | "done";

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  tags: string[];
  dueDate: string | null;
  description: string | null;
}

const statusColors: Record<ProjectStatus, string> = {
  "in-progress": "bg-blue-100 text-blue-800",
  backlog: "bg-gray-100 text-gray-700",
  done: "bg-green-100 text-green-800",
};

function useKanbanColumns() {
  const { t } = useI18n();
  return [
    { key: "backlog" as ProjectStatus, label: t.projects.statusBacklog },
    { key: "in-progress" as ProjectStatus, label: t.projects.statusInProgress },
    { key: "done" as ProjectStatus, label: t.projects.statusDone },
  ];
}

const EMPTY_FORM = { name: "", status: "backlog" as ProjectStatus, tags: "", dueDate: "", description: "" };

interface ProjectFormProps {
  initial?: Partial<typeof EMPTY_FORM>;
  onSubmit: (data: typeof EMPTY_FORM) => Promise<void>;
  onClose: () => void;
  title: string;
}

function ProjectForm({ initial, onSubmit, onClose, title }: ProjectFormProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
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
          <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder={t.projects.tagsPlaceholder} />
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

function TableView({ items, onEdit, onDelete, onOpen }: { items: Project[]; onEdit: (p: Project) => void; onDelete: (id: string) => void; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.projects.name}</TableHead>
          <TableHead>{t.projects.status}</TableHead>
          <TableHead>{t.projects.tags}</TableHead>
          <TableHead>{t.projects.dueDate}</TableHead>
          <TableHead>{t.projects.description}</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <button
                className="font-medium text-left hover:underline hover:text-primary transition-colors"
                onClick={() => onOpen(p.id)}
              >{p.name}</button>
            </TableCell>
            <TableCell>
              <Badge className={statusColors[p.status]}>{p.status}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                {p.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{p.dueDate ?? "—"}</TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{p.description ?? ""}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" title={t.projects.openProject} onClick={() => onOpen(p.id)}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(p.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function KanbanView({ items, onEdit, onDelete, onStatusChange, onOpen }: {
  items: Project[];
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
  onOpen: (id: string) => void;
}) {
  const { t } = useI18n();
  const kanbanColumns = useKanbanColumns();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ProjectStatus | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kanbanColumns.map((col) => {
        const colItems = items.filter((p) => p.status === col.key);
        const isOver = overCol === col.key;
        return (
          <div
            key={col.key}
            className="flex flex-col gap-3"
            onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setOverCol(null);
              if (draggingId) onStatusChange(draggingId, col.key);
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <Badge variant="secondary">{colItems.length}</Badge>
            </div>
            <div className={`space-y-2 min-h-24 rounded-lg transition-colors ${isOver ? "bg-accent/50 ring-2 ring-primary/30" : ""}`}>
              {colItems.map((p) => (
                <Card
                  key={p.id}
                  draggable
                  onDragStart={() => setDraggingId(p.id)}
                  onDragEnd={() => { setDraggingId(null); setOverCol(null); }}
                  className={`hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none ${draggingId === p.id ? "opacity-40" : ""}`}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        className="text-sm font-semibold text-left hover:underline hover:text-primary transition-colors"
                        onClick={() => onOpen(p.id)}
                      >{p.name}</button>
                      <div className="flex gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(p)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(p.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{p.dueDate ?? ""}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {colItems.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 border-2 border-dashed rounded-md">
                  {t.projects.noItems}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProjectsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/projects?${params}`);
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const id = setTimeout(fetchProjects, 300);
    return () => clearTimeout(id);
  }, [fetchProjects]);

  function openCreate() { setEditing(null); setSheetOpen(true); }
  function openEdit(p: Project) { setEditing(p); setSheetOpen(true); }
  function closeSheet() { setSheetOpen(false); setEditing(null); }

  async function handleCreate(form: typeof EMPTY_FORM) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        status: form.status,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || null,
        description: form.description || null,
      }),
    });
    if (res.ok) { closeSheet(); fetchProjects(); toast.success("Project created"); }
    else { toast.error("Failed to create project"); }
  }

  async function handleEdit(form: typeof EMPTY_FORM) {
    if (!editing) return;
    const res = await fetch(`/api/projects/${editing.id}`, {
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
    if (res.ok) { closeSheet(); fetchProjects(); toast.success("Project updated"); }
    else { toast.error("Failed to update project"); }
  }

  async function handleDelete(id: string) {
    if (!confirm(t.projects.deleteConfirm)) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) { fetchProjects(); toast.success("Project deleted"); }
    else { toast.error("Failed to delete project"); }
  }

  async function handleStatusChange(id: string, status: ProjectStatus) {
    // Optimistic update
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  function openDetail(id: string) { router.push(`/projects/${id}`); }

  const formInitial = editing
    ? {
        name: editing.name,
        status: editing.status,
        tags: editing.tags.join(", "),
        dueDate: editing.dueDate ?? "",
        description: editing.description ?? "",
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.projects.title}</h1>
        <p className="text-muted-foreground">{projects.length} {t.projects.totalProjects}</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.projects.search}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
          >
            <LayoutList className="w-4 h-4 mr-1" /> {t.projects.table}
          </Button>
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <Kanban className="w-4 h-4 mr-1" /> {t.projects.kanban}
          </Button>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> {t.projects.newProject}
        </Button>
      </div>

      {/* Sheet for create/edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6">
          <ProjectForm
            key={editing?.id ?? "new"}
            title={editing ? t.projects.editProject : t.projects.newProjectTitle}
            initial={formInitial}
            onSubmit={editing ? handleEdit : handleCreate}
            onClose={closeSheet}
          />
        </SheetContent>
      </Sheet>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t.projects.loading}</p>
          ) : view === "table" ? (
            <TableView items={projects} onEdit={openEdit} onDelete={handleDelete} onOpen={openDetail} />
          ) : (
            <KanbanView items={projects} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} onOpen={openDetail} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

