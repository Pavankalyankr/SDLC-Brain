"use client";

/**
 * SDLC Brain — Dashboard
 *
 * Main landing page with project overview, quick actions,
 * and system status cards.
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const modules = [
  {
    title: "Agile Assist",
    description: "SOW → Requirements → Epics → Features → Stories",
    icon: ClipboardList,
    href: "/projects",
    color: "var(--primary)",
    bgColor: "var(--primary-muted)",
  },
  {
    title: "Architecture",
    description: "System design, APIs, DB schemas, Mermaid diagrams",
    icon: Network,
    href: "/projects",
    color: "hsl(280, 70%, 60%)",
    bgColor: "hsl(280, 40%, 15%)",
  },
  {
    title: "Development",
    description: "Code generation with repository understanding",
    icon: Code2,
    href: "/projects",
    color: "hsl(142, 71%, 45%)",
    bgColor: "hsl(142, 40%, 15%)",
  },
  {
    title: "QA & Testing",
    description: "Test cases, edge cases, automation suggestions",
    icon: TestTube2,
    href: "/projects",
    color: "hsl(38, 92%, 50%)",
    bgColor: "hsl(38, 50%, 15%)",
  },
  {
    title: "Knowledge",
    description: "Search across all project artifacts",
    icon: BookOpen,
    href: "/projects",
    color: "hsl(199, 89%, 48%)",
    bgColor: "hsl(199, 50%, 15%)",
  },
  {
    title: "Code Review",
    description: "Bug detection, security, code smells",
    icon: GitPullRequest,
    href: "/projects",
    color: "hsl(340, 75%, 55%)",
    bgColor: "hsl(340, 40%, 15%)",
  },
  {
    title: "DevOps",
    description: "Dockerfile, CI/CD, release notes",
    icon: Container,
    href: "/projects",
    color: "hsl(170, 70%, 45%)",
    bgColor: "hsl(170, 40%, 15%)",
  },
  {
    title: "Production",
    description: "Log analysis, RCA, suggested fixes",
    icon: Server,
    href: "/projects",
    color: "hsl(0, 84%, 60%)",
    bgColor: "hsl(0, 50%, 15%)",
  },
];

const stats = [
  { label: "Active Projects", value: "0", icon: FolderKanban },
  { label: "Stories Generated", value: "0", icon: ClipboardList },
  { label: "AI Generations", value: "0", icon: Sparkles },
  { label: "Artifacts Approved", value: "0", icon: Zap },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--background-card)] to-[var(--background)] p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]">
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
              <Button className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
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
        {/* Background decoration */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--primary)] opacity-[0.03] blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[var(--primary)] opacity-[0.05] blur-2xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-[var(--border)] bg-[var(--background-card)]"
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--background-elevated)]">
                <stat.icon className="h-5 w-5 text-[var(--foreground-secondary)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SDLC Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          SDLC Modules
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {modules.map((module) => (
            <Link key={module.title} href={module.href}>
              <Card className={cn(
                "border-[var(--border)] bg-[var(--background-card)] card-hover h-full",
                "group"
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: module.bgColor }}
                    >
                      <module.icon
                        className="h-4.5 w-4.5"
                        style={{ color: module.color }}
                      />
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--foreground-tertiary)] opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-sm font-semibold text-[var(--foreground)] mb-1">
                    {module.title}
                  </CardTitle>
                  <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                    {module.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Workflow Overview */}
      <Card className="border-[var(--border)] bg-[var(--background-card)]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[var(--foreground)]">
            Human-in-the-Loop Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-3 py-4 flex-wrap">
            {[
              "Generate",
              "Review",
              "Feedback",
              "AI Refine",
              "Approve",
              "Continue",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2",
                    i === 0
                      ? "border-[var(--primary)] bg-[var(--primary-muted)] text-[var(--primary)]"
                      : i === 4
                      ? "border-[var(--success)] bg-[var(--success-muted)] text-[var(--success)]"
                      : "border-[var(--border)] bg-[var(--background-elevated)] text-[var(--foreground-secondary)]"
                  )}
                >
                  <span className="text-xs font-medium">{step}</span>
                </div>
                {i < 5 && (
                  <ArrowRight className="h-4 w-4 text-[var(--foreground-tertiary)]" />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[var(--foreground-tertiary)] mt-2">
            Nothing is final until approved. Every approval becomes project memory.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
