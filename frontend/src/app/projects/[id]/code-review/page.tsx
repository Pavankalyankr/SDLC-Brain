"use client";

import { useState } from "react";
import { use } from "react";
import {
  GitPullRequestDraft,
  Sparkles,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { AIThinking } from "@/components/shared/ai-thinking";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useCodeReviews, useGenerateCodeReview, reviewKeys, type CodeReview } from "@/hooks/use-code-review";
import { useQueryClient } from "@tanstack/react-query";

export default function CodeReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { startStream, isGenerating } = useAIGeneration();
  
  const { data: reviews = [] } = useCodeReviews(projectId);
  const genReview = useGenerateCodeReview(projectId);

  const handleGenerate = async () => {
    try {
      const res = await genReview.mutateAsync() as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/code-review", () => {
          queryClient.invalidateQueries({ queryKey: reviewKeys.reviews(projectId) });
        });
      }
    } catch (err) {
      // Error handled by UI toasts
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <GitPullRequestDraft className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Code Review Assist</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              AI-powered automated code reviews
            </p>
          </div>
        </div>
        <ReviewToolbar
          status="draft"
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onChat={() => {}}
          onEdit={() => {}}
          onApprove={() => {}}
          onHistory={() => {}}
          onRegenerate={handleGenerate}
          onExport={() => {}}
        />
      </div>

      {isGenerating && <AIThinking message="Analyzing codebase..." />}

      {!isGenerating && reviews.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--background-card)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
              <GitPullRequestDraft className="h-7 w-7 text-[var(--foreground-tertiary)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">No reviews generated</h3>
            <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-sm">
              Run an AI code review to analyze your codebase for bugs, style, and best practices.
            </p>
            <Button onClick={handleGenerate} className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
              <Sparkles className="h-4 w-4" />
              Run Code Review
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <Card key={review.id} className="border-[var(--border)] bg-[var(--background-card)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--foreground)]">{review.file_path}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
                      Score: {review.score}/100
                    </span>
                  </div>
                  <StatusBadge status={review.status} locked={false} />
                </div>
                <div className="p-3 bg-[var(--background)] rounded-md border border-[var(--border)]">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1 w-full">
                      <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">{review.review_comments}</p>
                      {review.suggestions && review.suggestions !== "[]" && (
                        <div className="mt-2 text-[10px] text-[var(--foreground-tertiary)] bg-[var(--background-card)] p-2 rounded">
                          <span className="font-medium text-[var(--foreground-secondary)] block mb-1">Suggestions:</span>
                          {review.suggestions}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
