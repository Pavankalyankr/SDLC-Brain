"use client";

import { useState } from "react";
import { use } from "react";
import {
  Code2,
  Sparkles,
  FileCode,
  TerminalSquare,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { AIThinking } from "@/components/shared/ai-thinking";
import { cn } from "@/lib/utils";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useCodeFiles, useGenerateCodeFiles, devKeys } from "@/hooks/use-development";
import { useQueryClient } from "@tanstack/react-query";

export default function DevelopmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  
  const queryClient = useQueryClient();
  const { startStream, isGenerating } = useAIGeneration();
  
  const { data: files = [] } = useCodeFiles(projectId);
  const genCode = useGenerateCodeFiles(projectId);

  const handleGenerate = async () => {
    try {
      const res = await genCode.mutateAsync(undefined) as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/development", () => {
          queryClient.invalidateQueries({ queryKey: devKeys.files(projectId) });
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Code2 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Development Assist</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              AI-generated source code from architecture
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

      {isGenerating && <AIThinking message="Generating code files..." />}

      {!isGenerating && files.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--background-card)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
              <Code2 className="h-7 w-7 text-[var(--foreground-tertiary)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">No code generated</h3>
            <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-sm">
              Generate source code based on approved architecture and user stories.
            </p>
            <Button onClick={handleGenerate} className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
              <Sparkles className="h-4 w-4" />
              Generate Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Explorer */}
          <Card className="col-span-1 border-[var(--border)] bg-[var(--background-card)]">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">Generated Files</h3>
              {files.map((file) => (
                <button
                  key={file.id}
                  className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-[var(--background-elevated)] text-left transition-colors"
                >
                  <FileCode className="h-4 w-4 text-[var(--primary)]" />
                  <span className="text-xs font-mono text-[var(--foreground)] truncate">{file.file_path}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Code Editor Preview */}
          <Card className="col-span-1 lg:col-span-2 border-[var(--border)] bg-[var(--background-card)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--background)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-[var(--foreground-secondary)]" />
                <span className="text-xs font-mono text-[var(--foreground-secondary)]">{files[0]?.file_path}</span>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={files[0]?.confidence || 0} />
                <StatusBadge status={files[0]?.status || "draft"} locked={false} />
              </div>
            </div>
            <CardContent className="p-0">
              <pre className="p-4 text-xs font-mono text-[var(--foreground)] bg-[var(--background-card)] overflow-x-auto">
                {files[0]?.content}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
