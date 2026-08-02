"use client";

/**
 * SDLC Brain — Dashboard
 *
 * Live stats from API + quick navigation to all SDLC modules.
 */

import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Brain,
  ClipboardList,
  Network,
  Code2,
  TestTube2,
  BookOpen,
  GitPullRequest,
  Container,
  Server,
  ArrowRight,
  Sparkles,
  Zap,
  FileText,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/use-projects";

const MODULES = [
  { title: "Agile Assist",    desc: "SOW → Requirements → Epics → Features → Stories", icon: ClipboardList, color: "var(--primary)",          bg: "var(--primary-muted)" },
  { title: "Architecture",    desc: "System design, APIs, DB schemas, Mermaid diagrams", icon: Network,       color: "hsl(280,70%,65%)",         bg: "hsl(280,40%,15%)" },
  { title: "Development",     desc: "AI code generation from approved architecture",      icon: Code2,          color: "hsl(142,71%,50%)",         bg: "hsl(142,40%,15%)" },
  { title: "QA & Testing",    desc: "Test cases, edge cases, automation suggestions",    icon: TestTube2,      color: "hsl(38,92%,55%)",          bg: "hsl(38,50%,15%)" },
  { title: "Knowledge",       desc: "Natural language search across all artifacts",       icon: BookOpen,       color: "hsl(199,89%,52%)",         bg: "hsl(199,50%,15%)" },
  { title: "Code Review",     desc: "Bug detection, security, code smells",              icon: GitPullRequest, color: "hsl(340,75%,60%)",         bg: "hsl(340,40%,15%)" },
  { title: "DevOps",          desc: "Dockerfile, CI/CD pipelines, release notes",        icon: Container,      color: "hsl(170,70%,50%)",         bg: "hsl(170,40%,15%)" },
  { title: "Production",      desc: "Log analysis, RCA, suggested fixes",               icon: Server,         color: "hsl(0,84%,62%)",           bg: "hsl(0,50%,15%)" },
];

const WORKFLOW_STEPS = ["Upload SOW", "Generate", "Review", "Approve", "Continue"];

export default function DashboardPage() {
  const { data: projects = [], isLoading } = useProjects();

  const activeProjects = projects.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Hero ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--background-card)] via-[var(--background-card)] to-[var(--background)] p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)] shadow-[0_0_24px_rgba(14,165,233,0.4)]">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                SDLC Brain
              </h1>
              <p className="text-sm text-[var(--foreground-secondary)]">
                AI-Powered Software Development Lifecycle Assistant
              </p>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--foreground-secondary)] mb-6">
            Transform a Statement of Work into a living software project. Generate requirements,
            architecture, code, tests, and documentation — with human review at every step.
          </p>
          <div className="flex gap-3">
            <Link href="/projects">
              <Button className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-[0_0_16px_rgba(14,165,233,0.3)] hover:shadow-[0_0_24px_rgba(14,165,233,0.5)] transition-all">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
            <Link href="/projects">
              <Button
                variant="outline"
                className="gap-2 border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]"
              >
                <FolderKanban className="h-4 w-4" />
                View Projects
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--primary)] opacity-[0.04] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 right-64 h-48 w-48 rounded-full bg-violet-500 opacity-[0.04] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-8 h-32 w-32 rounded-full bg-[var(--success)] opacity-[0.03] blur-2xl pointer-events-none" />
      </div>

      {/* ── Stats Cards ───────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Active Projects",
            value: isLoading ? "—" : String(activeProjects),
            icon: FolderKanban,
            color: "text-[var(--primary)]",
            bg: "bg-[var(--primary-muted)]",
            href: "/projects",
          },
          {
            label: "Total Projects",
            value: isLoading ? "—" : String(projects.length),
            icon: Activity,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
            href: "/projects",
          },
          {
            label: "AI Generations",
            value: "—",
            icon: Sparkles,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            href: null,
          },
          {
            label: "Artifacts Approved",
            value: "—",
            icon: Zap,
            color: "text-[var(--success)]",
            bg: "bg-[var(--success-muted)]",
            href: null,
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className={cn(
              "border-[var(--border)] bg-[var(--background-card)] transition-all",
              stat.href && "card-hover cursor-pointer"
            )}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">{stat.value}</p>
                <p className="text-xs text-[var(--foreground-secondary)]">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Recent Projects ───────────────────────────── */}
      {!isLoading && projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Recent Projects</h2>
            <Link
              href="/projects"
              className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {projects.slice(0, 3).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="border-[var(--border)] bg-[var(--background-card)] card-hover group h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-muted)]">
                        <FolderKanban className="h-4 w-4 text-[var(--primary)]" />
                      </div>
                      <Badge className="text-[10px] bg-[var(--success-muted)] text-[var(--success)] border-0 capitalize">
                        {project.status}
                      </Badge>
                    </div>
                    <h3 className="text-xs font-semibold text-[var(--foreground)] mb-1 group-hover:text-[var(--primary)] transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-[10px] text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
                      {project.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border)]">
                      <span className="text-[10px] text-[var(--foreground-tertiary)]">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--foreground-tertiary)] opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── SDLC Modules Grid ─────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">SDLC Modules</h2>
        <div className="grid grid-cols-4 gap-4">
          {MODULES.map((mod) => (
            <Link key={mod.title} href="/projects">
              <Card className="border-[var(--border)] bg-[var(--background-card)] card-hover group h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: mod.bg }}
                    >
                      <mod.icon className="h-4.5 w-4.5" style={{ color: mod.color }} />
                    </div>
                    <ArrowRight
                      className="h-4 w-4 text-[var(--foreground-tertiary)] opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-xs font-semibold text-[var(--foreground)] mb-1 group-hover:text-[var(--primary)] transition-colors">
                    {mod.title}
                  </CardTitle>
                  <p className="text-[10px] text-[var(--foreground-secondary)] leading-relaxed">
                    {mod.desc}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Human-in-the-Loop Workflow ────────────────── */}
      <Card className="border-[var(--border)] bg-[var(--background-card)]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[var(--foreground)]">
            Human-in-the-Loop Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-3 py-4 flex-wrap">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2 transition-all",
                    i === 0
                      ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                      : i === WORKFLOW_STEPS.length - 1
                      ? "border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]"
                      : "border-[var(--border)] bg-[var(--background-elevated)] text-[var(--foreground-secondary)]"
                  )}
                >
                  <span className="text-xs font-medium">{step}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-[var(--foreground-tertiary)]" />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[var(--foreground-tertiary)] mt-2">
            Nothing is final until approved. Every approval becomes project memory for future generations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
