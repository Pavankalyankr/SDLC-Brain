"use client";

/**
 * SDLC Brain — Artifact Card
 *
 * Reusable card for displaying any SDLC artifact
 * with status, confidence, and version info.
 */

import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ArtifactCardProps {
  id: string;
  title: string;
  description: string;
  status: string;
  confidence: number;
  version: number;
  locked?: boolean;
  type?: string;
  updatedAt?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function ArtifactCard({
  title,
  description,
  status,
  confidence,
  version,
  locked,
  type,
  updatedAt,
  onClick,
  className,
  children,
}: ArtifactCardProps) {
  return (
    <Card
      className={cn(
        "border-[var(--border)] bg-[var(--background-card)] card-hover cursor-pointer",
        locked && "border-l-2 border-l-[var(--success)]",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {type && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--foreground-tertiary)] mb-1 block">
                {type}
              </span>
            )}
            <h3 className="text-sm font-semibold text-[var(--foreground)] leading-snug truncate">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ConfidenceBadge confidence={confidence} />
            <StatusBadge status={status} locked={locked} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed line-clamp-2 mb-3">
          {description}
        </p>

        {children}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <span className="text-[11px] text-[var(--foreground-tertiary)]">
            v{version}
          </span>
          {updatedAt && (
            <span className="text-[11px] text-[var(--foreground-tertiary)]">
              {formatRelativeTime(updatedAt)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
