"use client";

/**
 * SDLC Brain — Architecture Detail Layout
 *
 * Provides persistent top navigation for System Design, API Contracts, and DB Schema,
 * matching the aesthetic and responsive layout of Agile Assist.
 */

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Server, Globe, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useSystemDesigns,
  useAPIContracts,
  useDBSchemas,
} from "@/hooks/use-architecture";
import { cn } from "@/lib/utils";

export default function ArchitectureLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const pathname = usePathname();

  const { data: designs = [] } = useSystemDesigns(projectId);
  const { data: apis = [] } = useAPIContracts(projectId);
  const { data: schemas = [] } = useDBSchemas(projectId);

  const tabs = [
    {
      value: "system-design",
      label: "System Design",
      icon: Server,
      count: designs.length,
      href: `/projects/${projectId}/architecture/system-design`,
    },
    {
      value: "api-contracts",
      label: "API Contracts",
      icon: Globe,
      count: apis.length,
      href: `/projects/${projectId}/architecture/api-contracts`,
    },
    {
      value: "db-schema",
      label: "DB Schema",
      icon: Database,
      count: schemas.length,
      href: `/projects/${projectId}/architecture/db-schema`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Layers className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Architecture Assist</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              System Design → API Contracts → Database Schema
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
              <tab.icon className="h-4 w-4" />
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
