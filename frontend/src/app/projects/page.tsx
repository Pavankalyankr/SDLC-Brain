"use client";

/**
 * SDLC Brain — Projects List Page
 *
 * All projects fetched from real API. Create/Delete wired to backend.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderKanban,
  ArrowRight,
  Calendar,
  MoreHorizontal,
  Trash2,
  Pencil,
  Search,
  Loader2,
  Clock,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
  type Project,
} from "@/hooks/use-projects";

export default function ProjectsPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newProject.name.trim()) return;
    try {
      const created = await createProject.mutateAsync({
        name: newProject.name.trim(),
        description: newProject.description.trim() || undefined,
      });
      toast.success(`Project "${created.name}" created`);
      setDialogOpen(false);
      setNewProject({ name: "", description: "" });
      router.push(`/projects/${created.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create project");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteProject.mutateAsync(id);
      toast.success(`"${name}" deleted`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete project");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Projects</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mt-0.5">
            {isLoading ? "Loading..." : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-56 bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] text-xs"
            />
          </div>

          {/* Create Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white h-9 text-xs" />
              }
            >
              <Plus className="h-4 w-4" />
              New Project
            </DialogTrigger>
            <DialogContent className="bg-[var(--background-elevated)] border-[var(--border)] text-[var(--foreground)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--foreground)]">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground-secondary)] mb-1.5 block">
                    Project Name *
                  </label>
                  <Input
                    placeholder="e.g., E-Commerce Platform"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground-secondary)] mb-1.5 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Brief project description..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                    className="bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:border-[var(--primary)] resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--background-hover)]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newProject.name.trim() || createProject.isPending}
                  className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
                >
                  {createProject.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5 h-[180px]">
              <div className="skeleton h-10 w-10 rounded-xl mb-4" />
              <div className="skeleton h-4 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-full rounded mb-1" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && (
        <>
          {filtered.length > 0 || projects.length === 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDelete}
                  isDeleting={deleteProject.isPending}
                />
              ))}

              {/* Create New Card */}
              <Card
                className="border-2 border-dashed border-[var(--border)] bg-transparent hover:border-[var(--primary)] hover:bg-[var(--primary-muted)] transition-all cursor-pointer group"
                onClick={() => setDialogOpen(true)}
              >
                <CardContent className="flex flex-col items-center justify-center gap-3 p-5 h-full min-h-[180px]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-card)] group-hover:border-[var(--primary)] group-hover:bg-[var(--primary-muted)] transition-all">
                    <Plus className="h-5 w-5 text-[var(--foreground-secondary)] group-hover:text-[var(--primary)] transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-[var(--foreground-secondary)] group-hover:text-[var(--primary)] transition-colors">
                    Create New Project
                  </span>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* No Search Results */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-card)] border border-[var(--border)] mb-4">
                <Search className="h-7 w-7 text-[var(--foreground-tertiary)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">No projects match "{searchQuery}"</h3>
              <p className="text-xs text-[var(--foreground-secondary)]">Try a different search term</p>
            </div>
          )}

          {/* True empty state when no projects exist at all */}
          {projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-card)] border border-[var(--border)] mb-4">
                <FolderKanban className="h-8 w-8 text-[var(--foreground-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No projects yet</h3>
              <p className="text-sm text-[var(--foreground-secondary)] mb-6 max-w-md">
                Create your first project to start transforming your SOW into a living software project.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
              >
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
  isDeleting,
}: {
  project: Project;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
  isDeleting: boolean;
}) {
  const statusColor =
    project.status === "active"
      ? "bg-[var(--success-muted)] text-[var(--success)]"
      : project.status === "completed"
      ? "bg-[var(--primary-muted)] text-[var(--primary)]"
      : "bg-[var(--background-elevated)] text-[var(--foreground-tertiary)]";

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="border-[var(--border)] bg-[var(--background-card)] card-hover group h-full">
        <CardContent className="p-5 flex flex-col h-full">
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-muted)]">
              <FolderKanban className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[10px] border-0 capitalize", statusColor)}>
                {project.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.preventDefault()}
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-[var(--foreground-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--background-hover)]"
                    />
                  }
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-[var(--background-elevated)] border-[var(--border)]"
                  onClick={(e) => e.preventDefault()}
                >
                  <DropdownMenuItem
                    className="gap-2 text-xs text-[var(--danger)] focus:bg-[var(--danger-muted)] focus:text-[var(--danger)] cursor-pointer"
                    onClick={(e) => onDelete(e, project.id, project.name)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1.5 group-hover:text-[var(--primary)] transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed line-clamp-2">
              {project.description || "No description provided"}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--foreground-tertiary)]">
              <Calendar className="h-3 w-3" />
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--foreground-tertiary)] opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
