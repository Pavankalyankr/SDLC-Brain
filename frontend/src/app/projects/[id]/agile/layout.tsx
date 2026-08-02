"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useRequirements,
  useEpics,
  useFeatures,
  useStories,
} from "@/hooks/use-agile";

export default function AgileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const pathname = usePathname();

  // We fetch counts to show in the tabs
  const { data: requirements = [] } = useRequirements(projectId);
  const { data: epics = [] } = useEpics(projectId);
  const { data: features = [] } = useFeatures(projectId);
  const { data: stories = [] } = useStories(projectId);

  const tabs = [
    { value: "requirements", label: "Requirements", count: requirements.length, href: `/projects/${projectId}/agile/requirements` },
    { value: "epics", label: "Epics", count: epics.length, href: `/projects/${projectId}/agile/epics` },
    { value: "features", label: "Features", count: features.length, href: `/projects/${projectId}/agile/features` },
    { value: "stories", label: "Stories", count: stories.length, href: `/projects/${projectId}/agile/stories` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-muted)]">
            <ClipboardList className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Agile Assist</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              Requirements → Epics → Features → Stories
            </p>
          </div>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                isActive
                  ? "text-[var(--foreground)] bg-[var(--background-elevated)] border-b-2 border-[var(--primary)]"
                  : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-muted)]"
              )}
            >
              {tab.label}
              <Badge
                variant="secondary"
                className={cn(
                  "h-5 min-w-5 text-[10px]",
                  isActive
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--background)] text-[var(--foreground-tertiary)]"
                )}
              >
                {tab.count}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Page Content */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
