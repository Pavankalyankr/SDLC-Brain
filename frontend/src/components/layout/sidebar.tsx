"use client";

/**
 * SDLC Brain — Sidebar Navigation
 *
 * Persistent sidebar with collapsible state, module navigation,
 * and project-scoped sub-navigation.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Network,
  Code2,
  TestTube2,
  BookOpen,
  GitPullRequest,
  Container,
  Server,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
];

const projectNav = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Agile Assist", href: "/agile", icon: ClipboardList },
  { label: "Architecture", href: "/architecture", icon: Network },
  { label: "Development", href: "/development", icon: Code2 },
  { label: "QA & Testing", href: "/qa", icon: TestTube2 },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Code Review", href: "/code-review", icon: GitPullRequest },
  { label: "DevOps", href: "/devops", icon: Container },
  { label: "Production", href: "/production", icon: Server },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCollapsed = mounted && sidebarCollapsed;

  // Extract project ID from path: /projects/{id}/...
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const currentProjectId = projectMatch?.[1];
  const isProjectPage = !!currentProjectId;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--border)]",
        "bg-[var(--sidebar-bg)] transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-[var(--border)] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]">
          <Brain className="h-4 w-4 text-white" />
        </div>
        {!isCollapsed && (
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)] animate-fade-in">
            SDLC Brain
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNav.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

            return (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
                collapsed={isCollapsed}
              />
            );
          })}
        </div>

        {/* Project Sub-Navigation */}
        {isProjectPage && (
          <>
            <Separator className="my-4 bg-[var(--border)]" />
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-[var(--foreground-tertiary)]">
                Project Modules
              </p>
            )}
            <div className="space-y-1">
              {projectNav.map((item) => {
                const fullHref = `/projects/${currentProjectId}${item.href}`;
                const isActive = item.href === ""
                  ? pathname === `/projects/${currentProjectId}`
                  : pathname.startsWith(fullHref);

                return (
                  <NavItem
                    key={item.href}
                    href={fullHref}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive}
                    collapsed={isCollapsed}
                  />
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[var(--border)] px-3 py-3 space-y-1">
        <NavItem
          href="/settings"
          icon={Settings}
          label="Settings"
          isActive={pathname.startsWith("/settings")}
          collapsed={isCollapsed}
        />

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
            "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]",
            "transition-colors duration-150"
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  collapsed,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  collapsed: boolean;
}) {
  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
        isActive
          ? "bg-[var(--primary)] bg-opacity-15 text-[var(--primary)] font-medium"
          : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-[var(--primary)]")} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span />}>{content}</TooltipTrigger>
        <TooltipContent side="right" className="bg-[var(--background-elevated)] text-[var(--foreground)] border-[var(--border)]">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
