"use client";

/**
 * SDLC Brain — Projects List Page
 *
 * View all projects with create new project dialog.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  FolderKanban,
  ArrowRight,
  Calendar,
  MoreHorizontal,
  Trash2,
  Pencil,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// Placeholder data for initial UI
const PLACEHOLDER_PROJECTS = [
  {
    id: "demo-1",
    name: "E-Commerce Platform",
    description: "Full-stack e-commerce platform with microservices architecture",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const projects = PLACEHOLDER_PROJECTS;

  const handleCreate = () => {
    // TODO: Call API
    setDialogOpen(false);
    setNewProject({ name: "", description: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Projects</h1>
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">
            Manage your software development projects
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white" />}
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
                  Project Name
                </label>
                <Input
                  placeholder="e.g., E-Commerce Platform"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:border-[var(--primary)] focus:ring-[var(--primary)]"
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
                  className="bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] focus:border-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-[var(--border)] text-[var(--foreground-secondary)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newProject.name.trim()}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
              >
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="border-[var(--border)] bg-[var(--background-card)] card-hover group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-muted)]">
                      <FolderKanban className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={(e) => e.preventDefault()}
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-[var(--foreground-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        }
                      >
                          <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[var(--background-elevated)] border-[var(--border)]">
                        <DropdownMenuItem className="gap-2 text-xs text-[var(--foreground)] focus:bg-[var(--background-hover)]">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs text-[var(--danger)] focus:bg-[var(--danger-muted)]">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed line-clamp-2 mb-4">
                    {project.description || "No description"}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--foreground-tertiary)]">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--foreground-tertiary)] opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Create New Card */}
          <Card
            className="border-2 border-dashed border-[var(--border)] bg-transparent hover:border-[var(--primary)] hover:bg-[var(--primary-muted)] transition-all cursor-pointer"
            onClick={() => setDialogOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center gap-3 p-5 h-full min-h-[180px]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--background-card)]">
                <Plus className="h-5 w-5 text-[var(--foreground-secondary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--foreground-secondary)]">
                Create New Project
              </span>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-card)] border border-[var(--border)] mb-4">
            <FolderKanban className="h-8 w-8 text-[var(--foreground-tertiary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            No projects yet
          </h3>
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
    </div>
  );
}
