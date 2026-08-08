"use client";

/**
 * SDLC Brain — Status Badge
 *
 * Visual indicator for artifact status: Draft, Review, Approved (Locked).
 */

import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "draft" | "review" | "approved" | string;
  locked?: boolean;
  className?: string;
}

export function StatusBadge({ status, locked, className }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md",
        status === "draft" && "status-draft",
        status === "review" && "status-review",
        status === "approved" && "status-approved",
        status === "fixed" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
        className
      )}
    >
      {locked && <Lock className="h-3 w-3" />}
      {status === "approved" && locked ? "Approved" : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
