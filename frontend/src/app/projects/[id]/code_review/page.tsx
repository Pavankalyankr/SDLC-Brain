// Force rebuild
"use client";

import { useState, useEffect, use } from "react";
import {
  GitPullRequestDraft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wrench,
  Undo2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { AIThinking } from "@/components/shared/ai-thinking";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { useCodeReviews, useGenerateCodeReview, useUpdateReviewStatus, useAutoFixReview, useRevertReview, reviewKeys, type CodeReview } from "@/hooks/use-code-review";
import { FileExplorer } from "@/components/development/file-explorer";
import { useTargetScope, TargetScopeSelector } from "@/components/shared/target-scope-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CodeEditor } from "@/components/development/code-editor";

export default function CodeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { startStream, isGenerating } = useAIGeneration();
  
  const [selectedFile, setSelectedFileState] = useState<string | null>(null);
  // Track which review's original code to pass to the editor for diff
  const [selectedReviewOriginalCode, setSelectedReviewOriginalCode] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const file = params.get("file");
      if (file) {
        setSelectedFileState(file);
      }
    }
  }, []);
  // Track which review IDs are currently being auto-fixed
  const [fixingIds, setFixingIds] = useState<Set<string>>(new Set());
  // Track which review IDs are currently being reverted
  const [revertingIds, setRevertingIds] = useState<Set<string>>(new Set());

  const setSelectedFile = (path: string | null, originalCode?: string) => {
    setSelectedFileState(path);
    setSelectedReviewOriginalCode(originalCode);
    if (typeof window !== "undefined") {
      const newParams = new URLSearchParams(window.location.search);
      if (path) {
        newParams.set("file", path);
      } else {
        newParams.delete("file");
      }
      router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
    }
  };

  const { data: reviews = [] } = useCodeReviews(projectId);
  const genReview = useGenerateCodeReview(projectId);
  const updateStatus = useUpdateReviewStatus(projectId);
  const autoFix = useAutoFixReview(projectId);
  const revertReview = useRevertReview(projectId);

  const {
    selectedStage,
    selectedItemId,
    setSelectedStage,
    setSelectedItemId,
  } = useTargetScope(projectId, "code_review");

  const handleGenerateReview = async () => {
    const targetName = selectedStage === "all" ? "Entire Project Workspace" : `${selectedStage}: ${selectedItemId}`;
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: reviewKeys.reviews(projectId) });
      
    try {
      const res = await genReview.mutateAsync({
        target_stage: selectedStage,
        target_id: selectedStage === "all" ? undefined : selectedItemId,
        instructions: `Generate a Code Review for Agile target (${targetName}).`
      }) as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/code-review", invalidate);
      }
    } catch {
      // Error handled by UI toasts
    } finally {
      invalidate();
    }
  };

  const handleApproveAll = async () => {
    const drafts = reviews.filter((r: CodeReview) => r.status === 'draft' && !r.locked);
    if (drafts.length === 0) return;
    
    toast.promise(
      Promise.all(drafts.map((r: CodeReview) => 
        updateStatus.mutateAsync({ reviewId: r.id, status: 'approved' })
      )),
      {
        loading: 'Approving all reviews...',
        success: 'All reviews approved!',
        error: 'Failed to approve some reviews'
      }
    );
  };

  const handleAutoFix = async (reviewId: string) => {
    setFixingIds((prev) => new Set(prev).add(reviewId));
    try {
      await autoFix.mutateAsync(reviewId);
    } finally {
      setFixingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  const handleRevert = async (reviewId: string) => {
    setRevertingIds((prev) => new Set(prev).add(reviewId));
    try {
      await revertReview.mutateAsync(reviewId);
    } finally {
      setRevertingIds((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-1 pb-4 px-4 overflow-hidden min-h-0 w-full h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <GitPullRequestDraft className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
              Code Review Assist
            </h1>
            <p className="text-sm text-[var(--foreground-secondary)] mt-1">
              AI-powered automated code reviews and actionable fix suggestions.
            </p>
          </div>
        </div>
      </div>

      {/* Target Agile Scope Selector */}
      <div className="mb-4 shrink-0">
        <TargetScopeSelector
          projectId={projectId}
          moduleName="code-review"
          title="Target Scope for Code Review"
          selectedStage={selectedStage}
          selectedItemId={selectedItemId}
          onStageChange={setSelectedStage}
          onItemChange={setSelectedItemId}
          onAction={handleGenerateReview}
          actionLabel="Generate Code Review"
          isActionLoading={isGenerating}
        />
      </div>

      {/* Main 2-Pane Layout (Agent Chat removed) */}
      <div className="flex-1 w-full min-h-0 flex gap-4 relative overflow-hidden">
        
        {/* LEFT: File Explorer (Fixed Width) */}
        <div className="w-72 shrink-0 h-full relative overflow-hidden flex flex-col">
          <FileExplorer projectId={projectId} onFileSelect={(path) => setSelectedFile(path)} />
        </div>

        {/* CENTER: Review Dashboard (Now full remaining width) */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden flex flex-col border border-[var(--border)] rounded-xl bg-[var(--background-card)] shadow-sm">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
            {isGenerating && <AIThinking message="Scanning codebase and generating review..." />}

            {!isGenerating && reviews.length > 0 && (
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Code Review Findings</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleApproveAll}
                  disabled={!reviews.some((r: CodeReview) => r.status === 'draft' && !r.locked)}
                  className="h-8 text-xs border-[var(--success-muted)] text-[var(--success)] hover:bg-[var(--success-muted)]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Approve All
                </Button>
              </div>
            )}

            {!isGenerating && reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
                  <GitPullRequestDraft className="h-7 w-7 text-[var(--foreground-tertiary)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">No reviews generated</h3>
                <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-sm">
                  Select a target scope above and run an AI code review to analyze your codebase for bugs, style, and best practices.
                </p>
              </div>
            ) : (
              reviews.map((review: CodeReview) => {
                const isFixed = review.status === "fixed";
                const isFixing = fixingIds.has(review.id);
                const isReverting = revertingIds.has(review.id);

                return (
                  <Card 
                    key={review.id} 
                    className={`border-[var(--border)] bg-[var(--background-elevated)] transition-all hover:border-[var(--primary)] hover:shadow-md cursor-pointer ${isFixed ? "opacity-80 border-emerald-500/30" : ""}`}
                    onClick={() => setSelectedFile(
                      review.file_path,
                      isFixed && review.original_code ? review.original_code : undefined
                    )}
                  >
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-medium text-[var(--foreground)] bg-muted px-1.5 py-0.5 rounded">{review.file_path}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                            review.severity === 'critical' ? 'bg-red-500/20 text-red-500 border-red-500/20' : 
                            review.severity === 'error' ? 'bg-red-400/20 text-red-400 border-red-400/20' : 
                            review.severity === 'warning' ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' : 
                            'bg-blue-500/20 text-blue-400 border-blue-500/20'
                          }`}>
                            {review.severity}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                            Score: {review.score}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={review.status} locked={review.locked} />
                          
                          {!review.locked && review.status !== "fixed" && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-[var(--foreground-secondary)]">
                                  <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[var(--background-elevated)] border-[var(--border)]">
                                  <DropdownMenuItem
                                    onClick={() => updateStatus.mutate({ reviewId: review.id, status: "approved" })}
                                    className="text-[var(--success)] focus:bg-[var(--success-muted)] focus:text-[var(--success)] cursor-pointer"
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Approve Review
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-[var(--background)] rounded-md border border-[var(--border)]">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-2 w-full">
                            <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-wrap font-mono">
                              {review.review_comments}
                            </p>
                            {review.suggestions && review.suggestions !== "[]" && (
                              <div className="mt-1 text-[11px] text-[var(--foreground-tertiary)] bg-[var(--background-card)] p-2 rounded">
                                <span className="font-semibold text-[var(--foreground-secondary)] block mb-1">AI Suggestions:</span>
                                <span className="whitespace-pre-wrap">{review.suggestions}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Auto-Fix / Fixed / Revert buttons — always at the bottom */}
                      <div className="flex justify-end gap-2 pt-1">
                        {isFixed ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isReverting}
                              className="h-7 text-xs text-[#d29922] border-[#d2992230] bg-[#d2992210] hover:bg-[#d2992220] disabled:opacity-60"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevert(review.id);
                              }}
                            >
                              {isReverting ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Reverting…
                                </>
                              ) : (
                                <>
                                  <Undo2 className="h-3 w-3 mr-1" />
                                  Revert Fix
                                </>
                              )}
                            </Button>
                            <span className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Fixed
                            </span>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isFixing || review.locked}
                            className="h-7 text-xs bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/20 disabled:opacity-60"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAutoFix(review.id);
                            }}
                          >
                            {isFixing ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Fixing…
                              </>
                            ) : (
                              <>
                                <Wrench className="h-3 w-3 mr-1" />
                                Auto-Fix
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* File Preview Modal with Diff Support */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent showCloseButton={true} className="sm:max-w-5xl w-full h-[85vh] p-4 flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>File Preview & Auto-Fix</DialogTitle>
            <DialogDescription>
              Viewing and editing <code className="text-xs bg-muted px-1 py-0.5 rounded">{selectedFile}</code>
              {selectedReviewOriginalCode && (
                <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#1f6feb22] text-[#58a6ff] border border-[#1f6feb44]">
                  Diff view available
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
            <CodeEditor
              projectId={projectId}
              selectedFile={selectedFile}
              originalCodeOverride={selectedReviewOriginalCode}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
