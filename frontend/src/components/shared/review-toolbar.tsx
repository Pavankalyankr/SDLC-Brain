"use client";

/**
 * SDLC Brain — Review Toolbar
 *
 * Consistent action bar for every artifact:
 * Generate | AI Chat | Edit | Approve | History | Export | Regenerate
 */

import {
  Sparkles,
  MessageSquare,
  Pencil,
  CheckCircle2,
  History,
  Download,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ExportMenu } from "@/components/shared/export-menu";
import { cn } from "@/lib/utils";

interface ReviewToolbarProps {
  status: string;
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
        "flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--background-card)] p-1.5",
        className
      )}
    >
      {/* Generate */}
      <ToolbarButton
        icon={Sparkles}
        label="Generate"
        onClick={onGenerate}
        disabled={locked || isGenerating}
        loading={isGenerating}
        variant="primary"
      />

      {/* AI Chat */}
      <ToolbarButton
        icon={MessageSquare}
        label="AI Chat"
        onClick={onChat}
      />

      <Separator orientation="vertical" className="h-6 bg-[var(--border)]" />

      {/* Edit */}
      <ToolbarButton
        icon={Pencil}
        label={locked ? "Create New Version" : "Edit"}
        onClick={onEdit}
      />

      {/* Approve */}
      <ToolbarButton
        icon={CheckCircle2}
        label="Approve"
        onClick={onApprove}
        disabled={status === "approved"}
        variant={status === "review" ? "success" : "default"}
      />

      <Separator orientation="vertical" className="h-6 bg-[var(--border)]" />

      {/* History */}
      <ToolbarButton
        icon={History}
        label="History"
        onClick={onHistory}
      />

      {/* Regenerate */}
      <ToolbarButton
        icon={RefreshCw}
        label="Regenerate"
        onClick={onRegenerate}
        disabled={locked}
      />

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
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-8 gap-1.5 text-xs",
              variant === "primary" && "text-[var(--primary)] hover:bg-[var(--primary-muted)]",
              variant === "success" && "text-[var(--success)] hover:bg-[var(--success-muted)]",
              variant === "default" && "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-hover)]",
              loading && "animate-pulse-glow"
            )}
          />
        }
      >
        <Icon className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        <span className="hidden sm:inline">{label}</span>
      </TooltipTrigger>
      <TooltipContent className="bg-[var(--background-elevated)] text-[var(--foreground)] border-[var(--border)]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
