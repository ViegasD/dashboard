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
import { LayoutList, Kanban, Search, Plus, Pencil, Trash2, ExternalLink, Users } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type ProjectStatus = "backlog" | "in-progress" | "done";

type MyRole = "owner" | "editor" | "viewer" | null;

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  tags: string[];
  dueDate: string | null;
  description: string | null;
  membersCount: number;
  myRole: MyRole;
}

const statusAccent: Record<ProjectStatus, string> = {
  backlog: "border-t-slate-400",
  "in-progress": "border-t-blue-500",
  done: "border-t-emerald-500",
};

const statusDot: Record<ProjectStatus, string> = {
  backlog: "bg-slate-400",
  "in-progress": "bg-blue-500",
  done: "bg-emerald-500",
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
              <div className="flex items-center gap-2">
                <button
                  className="font-medium text-left hover:underline hover:text-primary transition-colors"
                  onClick={() => onOpen(p.id)}
                >{p.name}</button>
                {p.membersCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />{p.membersCount}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                <span className={`w-2 h-2 rounded-full ${statusDot[p.status]}`} />
                {p.status}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                {p.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
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
                {p.myRole !== "viewer" && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(p)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
                {(p.myRole === "owner" || p.myRole === null) && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(p.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
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
    <div className="flex gap-4 min-h-[calc(100vh-220px)] overflow-x-auto pb-2">
      {kanbanColumns.map((col) => {
        const colItems = items.filter((p) => p.status === col.key);
        const isOver = overCol === col.key;
        return (
          <div
            key={col.key}
            className="flex flex-col w-72 shrink-0"
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
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-lg border-t-4 bg-muted/50 border border-b-0 ${statusAccent[col.key]}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusDot[col.key]}`} />
                <span className="text-sm font-semibold">{col.label}</span>
              </div>
              <Badge variant="secondary" className="text-xs">{colItems.length}</Badge>
            </div>

            {/* Cards container */}
            <div
              className={`flex-1 overflow-y-auto border border-t-0 rounded-b-lg p-2 space-y-2 transition-colors ${
                isOver ? "bg-accent/40 ring-2 ring-inset ring-primary/20" : "bg-muted/20"
              }`}
              style={{ maxHeight: "calc(100vh - 280px)" }}
            >
              {colItems.map((p) => (
                <Card
                  key={p.id}
                  draggable
                  onDragStart={() => setDraggingId(p.id)}
                  onDragEnd={() => { setDraggingId(null); setOverCol(null); }}
                  className={`cursor-grab active:cursor-grabbing select-none shadow-sm hover:shadow-md transition-all ${
                    draggingId === p.id ? "opacity-40 rotate-1 scale-95" : ""
                  }`}
                >
                  <CardContent className="px-3 py-3 space-y-2">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-1">
                      <button
                        className="text-sm font-semibold text-left leading-snug hover:text-primary transition-colors line-clamp-2"
                        onClick={() => onOpen(p.id)}
                      >
                        {p.name}
                      </button>
                      <div className="flex gap-0.5 shrink-0 -mt-0.5">
                        {p.myRole !== "viewer" && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => onEdit(p)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                        {(p.myRole === "owner" || p.myRole === null) && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(p.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    )}

                    {/* Tags */}
                    {p.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {p.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-0.5">
                      {p.membersCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />{p.membersCount}
                        </span>
                      ) : <span />}
                      {p.dueDate && (
                        <span className="text-[10px] text-muted-foreground">{p.dueDate}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {colItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg">
                  <p className="text-xs text-muted-foreground">{t.projects.noItems}</p>
                </div>
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
  const [view, setView] = useState<"table" | "kanban">("kanban");
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
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
        ...(form.description ? { description: form.description } : {}),
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
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
        ...(form.description ? { description: form.description } : {}),
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
      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t.projects.loading}</p>
      ) : view === "table" ? (
        <Card>
          <CardContent className="pt-6">
            <TableView items={projects} onEdit={openEdit} onDelete={handleDelete} onOpen={openDetail} />
          </CardContent>
        </Card>
      ) : (
        <KanbanView items={projects} onEdit={openEdit} onDelete={handleDelete} onStatusChange={handleStatusChange} onOpen={openDetail} />
      )}
    </div>
  );
}

