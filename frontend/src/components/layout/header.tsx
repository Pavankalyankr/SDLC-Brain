"use client";

/**
 * SDLC Brain — Header
 *
 * Top bar with breadcrumb navigation, global search (Ctrl+K),
 * and AI model selector.
 */

import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import {
  Search,
  ChevronRight,
  Bot,
  MessageSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const models = [
  { id: "deepseek-r1", label: "DeepSeek-R1", category: "Reasoning" },
  { id: "gemini-flash-latest", label: "Gemini Flash", category: "Engineering" },
];

export function Header() {
  const pathname = usePathname();
  const {
    sidebarCollapsed,
    selectedModel,
    setSelectedModel,
    setCommandOpen,
    toggleAIPanel,
  } = useAppStore();

  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header
      className={cn(
        "fixed top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--border)]",
        "bg-[var(--background)]/80 backdrop-blur-xl",
        "transition-all duration-300",
        sidebarCollapsed ? "left-[72px]" : "left-[260px]",
        "right-0 px-6"
      )}
    >
      {/* Left: Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />
            )}
            <span
              className={cn(
                i === breadcrumbs.length - 1
                  ? "font-medium text-[var(--foreground)]"
                  : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] cursor-pointer transition-colors"
              )}
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right: Search + Model + AI Chat */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommandOpen(true)}
                className={cn(
                  "h-8 gap-2 border-[var(--border)] bg-[var(--background-card)]",
                  "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]",
                  "hover:bg-[var(--background-elevated)] hover:border-[var(--border-strong)]",
                  "transition-all w-52 justify-start"
                )}
              />
            }
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="ml-auto text-[10px] font-mono text-[var(--foreground-tertiary)] bg-[var(--background)] rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </TooltipTrigger>
          <TooltipContent className="bg-[var(--background-elevated)] text-[var(--foreground)] border-[var(--border)]">
            Global Search (Ctrl+K)
          </TooltipContent>
        </Tooltip>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-[var(--foreground-secondary)]" />
          <Select value={selectedModel} onValueChange={(v) => v && setSelectedModel(v)}>
            <SelectTrigger
              className={cn(
                "h-8 w-40 border-[var(--border)] bg-[var(--background-card)]",
                "text-xs text-[var(--foreground)]",
                "hover:bg-[var(--background-elevated)] hover:border-[var(--border-strong)]",
                "focus:ring-[var(--primary)] focus:ring-1"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--background-elevated)] border-[var(--border)]">
              {models.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className="text-xs text-[var(--foreground)] focus:bg-[var(--background-hover)] focus:text-[var(--foreground)]"
                >
                  <div className="flex items-center gap-2">
                    <span>{model.label}</span>
                    <span className="text-[10px] text-[var(--foreground-tertiary)]">
                      {model.category}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* AI Chat Toggle */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAIPanel}
                className={cn(
                  "h-8 w-8 p-0 border-[var(--border)] bg-[var(--background-card)]",
                  "text-[var(--foreground-secondary)] hover:text-[var(--primary)]",
                  "hover:bg-[var(--primary-muted)] hover:border-[var(--primary)]",
                  "transition-all"
                )}
              />
            }
          >
            <MessageSquare className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent className="bg-[var(--background-elevated)] text-[var(--foreground)] border-[var(--border)]">
            AI Assistant
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

function generateBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [
    { label: "SDLC Brain", href: "/" },
  ];

  const labelMap: Record<string, string> = {
    projects: "Projects",
    requirements: "Requirements",
    architecture: "Architecture",
    development: "Development",
    qa: "QA & Testing",
    knowledge: "Knowledge",
    "code-review": "Code Review",
    devops: "DevOps",
    production: "Production",
    settings: "Settings",
    "ai-config": "AI Configuration",
  };

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = labelMap[segment] || (segment.length === 36 ? "Project" : segment);
    crumbs.push({ label, href: currentPath });
  }

  return crumbs;
}
