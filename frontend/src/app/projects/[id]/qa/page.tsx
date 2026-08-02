"use client";

import { useState } from "react";
import { use } from "react";
import {
  TestTube,
  Sparkles,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { AIThinking } from "@/components/shared/ai-thinking";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useQueryClient } from "@tanstack/react-query";
import { useTestCases, useGenerateTestCases, type TestCase } from "@/hooks/use-qa";

export default function QAPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { startStream, isGenerating } = useAIGeneration();
  
  const { data: tests = [], isLoading } = useTestCases(projectId);
  const genQA = useGenerateTestCases(projectId);

  const handleGenerate = async () => {
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ["test_cases", projectId] });
    try {
      const res = await genQA.mutateAsync({}) as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/qa", invalidate);
      }
    } catch {
      // Error handled by UI toasts
    } finally {
      invalidate();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <TestTube className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">QA Assist</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              AI-generated test plans and test cases
            </p>
          </div>
        </div>
        <ReviewToolbar
          status="draft"
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onRegenerate={handleGenerate}
        />
      </div>

      {isGenerating && <AIThinking message="Generating test cases..." />}

      {!isGenerating && tests.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--background-card)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
              <TestTube className="h-7 w-7 text-[var(--foreground-tertiary)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">No tests generated</h3>
            <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-sm">
              Generate comprehensive test cases based on your code and requirements.
            </p>
            <Button onClick={handleGenerate} className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
              <Sparkles className="h-4 w-4" />
              Generate Tests
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test: TestCase) => (
            <Card key={test.id} className="border-[var(--border)] bg-[var(--background-card)]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <ListChecks className="h-4 w-4 text-[var(--primary)] mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-[var(--foreground)]">{test.title}</h3>
                    <p className="text-xs text-[var(--foreground-secondary)] mt-1">{test.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-medium px-2 py-1 bg-[var(--background-elevated)] text-[var(--foreground-secondary)] rounded-md">
                    {test.test_type}
                  </span>
                  <StatusBadge status={test.status} locked={false} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
