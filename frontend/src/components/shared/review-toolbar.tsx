"use client";

/**
 * SDLC Brain — Review Toolbar
 *
 * Consistent action bar for every artifact:
 * Generate | Regenerate | Export
 * Chat, Edit, Approve, History — shown only when wired up.
 */

import {
  Sparkles,
  MessageSquare,
  Pencil,
  CheckCircle2,
  History,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ExportMenu } from "@/components/shared/export-menu";
import { cn } from "@/lib/utils";

interface ReviewToolbarProps {
  status?: string;
  locked?: boolean;
  onGenerate?: () => void;
  onChat?: () => void;
  onEdit?: () => void;
  onApprove?: () => void;
  onHistory?: () => void;
  onRegenerate?: () => void;
  onExport?: (format: string) => void;
  isGenerating?: boolean;
  className?: string;
}

export function ReviewToolbar({
  status,
  locked,
  onGenerate,
  onChat,
  onEdit,
  onApprove,
  onHistory,
  onRegenerate,
  onExport,
  isGenerating,
  className,
}: ReviewToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background-card)] p-1",
        className
      )}
    >
      {/* Generate — primary action */}
      <ToolbarButton
        icon={isGenerating ? Sparkles : Sparkles}
        label={isGenerating ? "Generating..." : "Generate"}
        onClick={onGenerate}
        disabled={locked || isGenerating || !onGenerate}
        loading={isGenerating}
        variant="primary"
      />

      {/* Regenerate */}
      {onRegenerate && (
        <ToolbarButton
          icon={RefreshCw}
          label="Regenerate"
          onClick={onRegenerate}
          disabled={locked || isGenerating}
        />
      )}

      {onRegenerate && onExport && (
        <Separator orientation="vertical" className="h-5 bg-[var(--border)] mx-0.5" />
      )}

      {/* Approve */}
      {onApprove && (
        <ToolbarButton
          icon={locked ? Lock : CheckCircle2}
          label={locked ? "Approved & Locked" : "Approve All"}
          onClick={locked ? undefined : onApprove}
          disabled={locked || isGenerating}
          variant={status === "review" ? "success" : "default"}
        />
      )}

      {/* History */}
      {onHistory && (
        <ToolbarButton
          icon={History}
          label="Version History"
          onClick={onHistory}
          disabled={isGenerating}
        />
      )}

      {/* Export */}
      {onExport && <ExportMenu onExport={onExport} />}
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  loading,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "primary" | "success";
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<div className="inline-flex" />}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-8 gap-1.5 text-xs px-2.5",
            variant === "primary" &&
              "text-[var(--primary)] hover:bg-[var(--primary-muted)] hover:text-[var(--primary)]",
            variant === "success" &&
              "text-[var(--success)] hover:bg-[var(--success-muted)] hover:text-[var(--success)]",
            variant === "default" &&
              "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]",
            loading && "animate-pulse"
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-[var(--background-elevated)] text-[var(--foreground)] border-[var(--border)] text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
