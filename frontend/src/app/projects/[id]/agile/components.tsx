import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, CheckCircle2, History, ClipboardList, Sparkles, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

export interface ArtifactListProps {
  type: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    confidence: number;
    version: number;
    locked: boolean;
    priority?: string | null;
    category?: string | null;
    story_points?: number | null;
    sprint?: string | null;
    acceptance_criteria?: string | null;
  }>;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onApproveAll: () => void;
  onHistory: (id: string) => void;
  onMetadataUpdate?: (id: string, data: any) => void;
}

export function ArtifactList({ type, items, expandedIds, onToggle, onStatusUpdate, onApproveAll, onHistory, onMetadataUpdate }: ArtifactListProps) {
  const unapproved = items.filter((i) => i.status !== "approved").length;

  return (
    <div className="space-y-3">
      {/* Bulk Actions */}
      {unapproved > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-4 py-2">
          <span className="text-xs text-[var(--foreground-secondary)]">
            {unapproved} item(s) pending approval
          </span>
          <Button
            size="sm"
            onClick={onApproveAll}
            className="h-7 gap-1.5 text-xs bg-[var(--success)] hover:bg-[var(--success)]/90 text-white"
          >
            <CheckCircle2 className="h-3 w-3" />
            Approve All
          </Button>
        </div>
      )}

      {/* Artifact Cards */}
      <AnimatePresence>
        {items.map((item, index) => {
          const isExpanded = expandedIds.has(item.id);
          const MotionCard = motion.create(Card);
          return (
            <MotionCard
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              key={item.id}
              className={cn(
                "border-[var(--border)] bg-[var(--background-card)] transition-all hover:border-[var(--primary)] hover:shadow-md",
                item.locked && "border-l-2 border-l-[var(--success)]"
              )}
            >
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-start md:items-center gap-3 flex-col md:flex-row">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => onToggle(item.id)}
                      className="text-[var(--foreground-secondary)] hover:text-[var(--primary)] transition-colors mt-0.5 md:mt-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* REMOVED truncate to fix info getting cut */}
                        <h3 className="text-sm font-semibold text-[var(--foreground)] leading-tight">
                          {item.title}
                        </h3>
                        {(type === "stories" || item.priority) && (
                          <Badge
                            className={cn(
                              "text-[10px] border-0 relative transition-colors",
                              (type === "stories" && onMetadataUpdate) ? "p-0 hover:brightness-110" : "",
                              item.priority === "high" && "bg-[var(--danger-muted)] text-[var(--danger)]",
                              item.priority === "medium" && "bg-[var(--warning-muted)] text-[var(--warning)]",
                              (item.priority === "low" || !item.priority) && "bg-[var(--background-elevated)] text-[var(--foreground-tertiary)]"
                            )}
                          >
                            {type === "stories" && onMetadataUpdate ? (
                              <div className="flex items-center gap-1 h-full w-full px-2 py-0.5 relative group cursor-pointer">
                                <select
                                  value={item.priority || ""}
                                  onChange={(e) => onMetadataUpdate(item.id, { priority: e.target.value })}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                >
                                  <option value="" disabled>Priority</option>
                                  <option value="high">high</option>
                                  <option value="medium">medium</option>
                                  <option value="low">low</option>
                                </select>
                                <span>{item.priority || "Priority"}</span>
                                <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                              </div>
                            ) : (
                              item.priority
                            )}
                          </Badge>
                        )}
                        {item.category && (
                          <Badge className="text-[10px] bg-[var(--background-elevated)] text-[var(--foreground-tertiary)] border-0">
                            {item.category}
                          </Badge>
                        )}
                        {(type === "stories" || item.story_points) && (
                          <Badge className={cn("text-[10px] bg-[var(--primary-muted)] text-[var(--primary)] border-0 transition-colors", (type === "stories" && onMetadataUpdate) ? "p-0 hover:brightness-110" : "")}>
                            {type === "stories" && onMetadataUpdate ? (
                              <div className="flex items-center gap-1 h-full w-full px-2 py-0.5 relative group cursor-pointer">
                                <select
                                  value={item.story_points || ""}
                                  onChange={(e) => onMetadataUpdate(item.id, { story_points: parseInt(e.target.value) || null })}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                >
                                  <option value="" disabled>pts</option>
                                  <option value="1">1 pt</option>
                                  <option value="2">2 pts</option>
                                  <option value="3">3 pts</option>
                                  <option value="5">5 pts</option>
                                  <option value="8">8 pts</option>
                                  <option value="13">13 pts</option>
                                  <option value="21">21 pts</option>
                                </select>
                                <span>{item.story_points ? `${item.story_points} pts` : "pts"}</span>
                                <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                              </div>
                            ) : (
                              `${item.story_points} pts`
                            )}
                          </Badge>
                        )}
                        {(type === "stories" || item.sprint) && (
                          <Badge className={cn("text-[10px] bg-[var(--background-elevated)] text-[var(--foreground-tertiary)] border-0 transition-colors", (type === "stories" && onMetadataUpdate) ? "p-0 hover:brightness-110" : "")}>
                            {type === "stories" && onMetadataUpdate ? (
                              <div className="flex items-center gap-1 h-full w-full px-2 py-0.5 relative group cursor-pointer">
                                <select
                                  value={item.sprint || ""}
                                  onChange={(e) => onMetadataUpdate(item.id, { sprint: e.target.value })}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                >
                                  <option value="" disabled>Sprint</option>
                                  <option value="Sprint 1">Sprint 1</option>
                                  <option value="Sprint 2">Sprint 2</option>
                                  <option value="Sprint 3">Sprint 3</option>
                                  <option value="Sprint 4">Sprint 4</option>
                                  <option value="Sprint 5">Sprint 5</option>
                                  <option value="Backlog">Backlog</option>
                                </select>
                                <span>{item.sprint || "Sprint"}</span>
                                <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                              </div>
                            ) : (
                              item.sprint
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-6 md:ml-0">
                    <ConfidenceBadge confidence={item.confidence} />
                    <StatusBadge status={item.status} locked={item.locked} />

                    {!item.locked && (
                      <div className="flex gap-1">
                        {item.status === "draft" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onStatusUpdate(item.id, "review")}
                            className="h-7 text-[10px] text-[var(--warning)] hover:bg-[var(--warning-muted)]"
                          >
                            Review
                          </Button>
                        )}
                        {(item.status === "draft" || item.status === "review") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onStatusUpdate(item.id, "approved")}
                            className="h-7 text-[10px] text-[var(--success)] hover:bg-[var(--success-muted)]"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 md:ml-7 space-y-3 animate-fade-in border-t border-[var(--border)] pt-3">
                    <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </p>
                    {item.acceptance_criteria && (
                      <div className="mt-3 bg-[var(--background-elevated)] p-3 rounded-md border border-[var(--border)]">
                        <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider mb-2">
                          Acceptance Criteria
                        </p>
                        <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-wrap">
                          {item.acceptance_criteria}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 pt-2 text-[10px] text-[var(--foreground-tertiary)]">
                      <span className="font-medium bg-[var(--background-elevated)] px-2 py-0.5 rounded">v{item.version}</span>
                      <span>ID: {item.id.slice(0, 8)}</span>
                      <button onClick={() => onHistory(item.id)} className="hover:text-[var(--primary)] transition-colors flex items-center gap-1">
                        <History className="h-3 w-3" /> View History
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </MotionCard>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function EmptyModuleState({
  title,
  description,
  actionLabel,
  onAction,
  disabled,
  loading,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)] shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4 shadow-sm">
          <ClipboardList className="h-7 w-7 text-[var(--primary)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--foreground-secondary)] mb-6 max-w-sm">{description}</p>
        <Button
          onClick={onAction}
          disabled={disabled || loading}
          className={cn(
            "gap-2 px-6",
            disabled
              ? "bg-[var(--background-elevated)] text-[var(--foreground-tertiary)]"
              : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md hover:shadow-lg transition-all"
          )}
        >
          <Sparkles className={cn("h-4 w-4", loading && "animate-spin")} />
          {loading ? "Generating..." : actionLabel}
        </Button>
        {disabled && (
          <p className="text-[11px] text-[var(--warning)] mt-4 flex items-center gap-1 bg-[var(--warning-muted)] px-3 py-1.5 rounded-md">
            <AlertCircle className="h-3.5 w-3.5" />
            Approve parent artifacts to unlock generation
          </p>
        )}
      </CardContent>
    </Card>
  );
}
