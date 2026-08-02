"use client";

/**
 * SDLC Brain — Project Overview Page
 *
 * Professional project dashboard with real API data.
 * Shows project info, document upload, module progress, and memory.
 */

import { use, useState, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  ClipboardList,
  Network,
  Code2,
  TestTube2,
  BookOpen,
  GitPullRequest,
  Container,
  Server,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  Trash2,
  Loader2,
  Plus,
  LayoutDashboard,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/shared/file-upload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useProject,
  useProjectDocuments,
  useUploadDocument,
  type Document,
} from "@/hooks/use-projects";
import { documentApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const MODULES = [
  { name: "Agile Assist", href: "/agile", icon: ClipboardList, color: "text-[var(--primary)]", bg: "bg-[var(--primary-muted)]" },
  { name: "Architecture",  href: "/architecture",  icon: Network,       color: "text-violet-400",          bg: "bg-violet-500/10" },
  { name: "Development",   href: "/development",   icon: Code2,          color: "text-emerald-400",         bg: "bg-emerald-500/10" },
  { name: "QA & Testing",  href: "/qa",            icon: TestTube2,      color: "text-amber-400",           bg: "bg-amber-500/10" },
  { name: "Knowledge",     href: "/knowledge",     icon: BookOpen,       color: "text-cyan-400",            bg: "bg-cyan-500/10" },
  { name: "Code Review",   href: "/code-review",   icon: GitPullRequest, color: "text-pink-400",            bg: "bg-pink-500/10" },
  { name: "DevOps",        href: "/devops",        icon: Container,      color: "text-teal-400",            bg: "bg-teal-500/10" },
  { name: "Production",    href: "/production",    icon: Server,         color: "text-rose-400",            bg: "bg-rose-500/10" },
];

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: project, isLoading: loadingProject } = useProject(id);
  const { data: documents = [], isLoading: loadingDocs } = useProjectDocuments(id);
  const uploadDoc = useUploadDocument(id);

  const [isDeletingDoc, setIsDeletingDoc] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        try {
          await uploadDoc.mutateAsync(file);
          toast.success(`Uploaded ${file.name}`);
        } catch (err: any) {
          toast.error(err?.message || `Failed to upload ${file.name}`);
        }
      }
    },
    [uploadDoc]
  );

  const handleDeleteDoc = async (docId: string) => {
    setIsDeletingDoc(docId);
    try {
      await documentApi.delete(id, docId);
      queryClient.invalidateQueries({ queryKey: ["projects", id, "documents"] });
      toast.success("Document deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete document");
    } finally {
      setIsDeletingDoc(null);
    }
  };

  const hasDocuments = documents.length > 0;
  const readyDocs = documents.filter((d) => d.status === "ready");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Project Header ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--background-card)] via-[var(--background-card)] to-[var(--background)] p-6">
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary-muted)] border border-[var(--primary)]/20">
              <LayoutDashboard className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <div>
              {loadingProject ? (
                <>
                  <div className="skeleton h-6 w-48 rounded mb-1" />
                  <div className="skeleton h-4 w-72 rounded" />
                </>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-[var(--foreground)]">
                    {project?.name || "Project"}
                  </h1>
                  <p className="text-sm text-[var(--foreground-secondary)] mt-0.5">
                    {project?.description || "No description"}
                  </p>
                </>
              )}
            </div>
          </div>
          <Badge className="gap-1.5 bg-[var(--success-muted)] text-[var(--success)] border-0 text-xs capitalize">
            <CheckCircle2 className="h-3 w-3" />
            {project?.status || "active"}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="relative z-10 flex items-center gap-6 mt-5 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
            <FileText className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />
            <span>
              {loadingDocs ? (
                <span className="skeleton inline-block h-3 w-16 rounded" />
              ) : (
                `${documents.length} document${documents.length !== 1 ? "s" : ""} uploaded`
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
            <Brain className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />
            <span>0 memory entries</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />
            <span>0 artifacts approved</span>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--primary)] opacity-[0.04] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 right-32 h-32 w-32 rounded-full bg-violet-500 opacity-[0.04] blur-3xl pointer-events-none" />
      </div>

      {/* ── Main Content Grid ──────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Left — Documents Upload (2/3 width) */}
        <div className="col-span-2 space-y-6">
          {/* SOW Documents */}
          <Card className="border-[var(--border)] bg-[var(--background-card)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                  <Upload className="h-4 w-4 text-[var(--primary)]" />
                  Statement of Work
                  {readyDocs.length > 0 && (
                    <Badge className="ml-1 text-[10px] bg-[var(--success-muted)] text-[var(--success)] border-0">
                      {readyDocs.length} Ready
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Uploaded Documents */}
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg bg-[var(--background)] border border-[var(--border)] px-4 py-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-muted)]">
                      <FileText className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--foreground)]">{doc.filename}</p>
                      <p className="text-[10px] text-[var(--foreground-tertiary)]">
                        {new Date(doc.created_at).toLocaleDateString()} ·{" "}
                        {doc.size_bytes ? `${(doc.size_bytes / 1024).toFixed(0)} KB` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[10px] border-0 capitalize",
                        doc.status === "ready"
                          ? "bg-[var(--success-muted)] text-[var(--success)]"
                          : doc.status === "failed"
                          ? "bg-[var(--danger-muted)] text-[var(--danger)]"
                          : "bg-[var(--warning-muted)] text-[var(--warning)]"
                      )}
                    >
                      {doc.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-[var(--foreground-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)] transition-all"
                      onClick={() => handleDeleteDoc(doc.id)}
                      disabled={isDeletingDoc === doc.id}
                    >
                      {isDeletingDoc === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}

              {/* Upload Zone */}
              <div className={cn(hasDocuments && "pt-2")}>
                {hasDocuments && (
                  <p className="text-[11px] text-[var(--foreground-tertiary)] mb-2 flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    Add more documents
                  </p>
                )}
                <FileUpload
                  onUpload={handleUpload}
                  className={uploadDoc.isPending ? "opacity-50 pointer-events-none" : ""}
                />
              </div>

              {/* Instruction when no documents */}
              {!hasDocuments && !loadingDocs && (
                <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-[var(--primary-muted)] border border-[var(--primary)]/20">
                  <AlertCircle className="h-3.5 w-3.5 text-[var(--primary)] mt-0.5 shrink-0" />
                  <p className="text-[11px] text-[var(--primary)] leading-relaxed">
                    Upload your Statement of Work to unlock AI generation. Supported formats: PDF, DOCX, TXT (max 50MB).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SDLC Module Grid */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
              <span>SDLC Modules</span>
              <Badge className="text-[10px] bg-[var(--background-elevated)] text-[var(--foreground-tertiary)] border border-[var(--border)]">
                {MODULES.length} modules
              </Badge>
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {MODULES.map((mod) => {
                const href = `/projects/${id}${mod.href}`;
                return (
                  <Link key={mod.name} href={href}>
                    <Card className="border-[var(--border)] bg-[var(--background-card)] card-hover group cursor-pointer">
                      <CardContent className="flex flex-col items-start gap-3 p-4">
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110", mod.bg)}>
                          <mod.icon className={cn("h-4 w-4", mod.color)} />
                        </div>
                        <div className="w-full">
                          <p className="text-xs font-medium text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                            {mod.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-[var(--foreground-tertiary)]">0 artifacts</p>
                            <ArrowRight className="h-3 w-3 text-[var(--foreground-tertiary)] opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Memory & Workflow */}
        <div className="space-y-4">
          {/* Project Memory */}
          <Card className="border-[var(--border)] bg-[var(--background-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <Brain className="h-4 w-4 text-[var(--primary)]" />
                Project Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-[var(--foreground-tertiary)] italic mb-3">
                Memory is built automatically as you approve artifacts.
              </p>
              <div className="space-y-1.5">
                {[
                  { key: "Tech Stack", icon: "⚡" },
                  { key: "Architecture", icon: "🏗️" },
                  { key: "Database", icon: "🗄️" },
                  { key: "Auth Method", icon: "🔐" },
                ].map((entry) => (
                  <div
                    key={entry.key}
                    className="flex items-center justify-between rounded-lg bg-[var(--background)] px-3 py-2 border border-[var(--border)]"
                  >
                    <span className="text-xs text-[var(--foreground-secondary)] flex items-center gap-2">
                      <span className="text-[10px]">{entry.icon}</span>
                      {entry.key}
                    </span>
                    <span className="text-[10px] text-[var(--foreground-tertiary)] italic">Not set</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SDLC Workflow Checklist */}
          <Card className="border-[var(--border)] bg-[var(--background-card)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[var(--foreground)]">
                Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {[
                  { step: "Upload SOW", done: hasDocuments },
                  { step: "Generate Requirements", done: false },
                  { step: "Approve Requirements", done: false },
                  { step: "Generate Architecture", done: false },
                  { step: "Generate Code", done: false },
                  { step: "Generate Tests", done: false },
                  { step: "Code Review", done: false },
                  { step: "DevOps Setup", done: false },
                ].map((item, i) => {
                  const isNext = !item.done && i > 0 && ([...Array(i)].every((_, j) => false));
                  const isFirst = !item.done && i === 0;
                  const isActive = !item.done && (i === 0 || (i > 0 && !item.done));
                  return (
                    <div
                      key={item.step}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors",
                        item.done
                          ? "bg-[var(--success-muted)] text-[var(--success)]"
                          : i === 0 && !hasDocuments
                          ? "bg-[var(--primary-muted)] text-[var(--primary)]"
                          : "bg-[var(--background)] text-[var(--foreground-tertiary)]"
                      )}
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <div
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            i === 0 && !hasDocuments
                              ? "bg-[var(--primary)]"
                              : "bg-[var(--foreground-tertiary)]"
                          )}
                        />
                      )}
                      <span className="truncate">{item.step}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
