"use client";

import { useState } from "react";
import { use } from "react";
import {
  Rocket,
  Sparkles,
  Container,
  Settings,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { AIThinking } from "@/components/shared/ai-thinking";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { usePipelines, useInfra, useGenerateDevOps, devopsKeys } from "@/hooks/use-devops";
import { useQueryClient } from "@tanstack/react-query";

export default function DevOpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { startStream, isGenerating } = useAIGeneration();
  
  const { data: pipelines = [] } = usePipelines(projectId);
  const { data: infra = [] } = useInfra(projectId);
  const genDevOps = useGenerateDevOps(projectId);

  const configs = [...pipelines, ...infra];

  const handleGenerate = async () => {
    try {
      const res = await genDevOps.mutateAsync() as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/devops", () => {
          queryClient.invalidateQueries({ queryKey: devopsKeys.pipelines(projectId) });
          queryClient.invalidateQueries({ queryKey: devopsKeys.infra(projectId) });
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
            <Rocket className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">DevOps Assist</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              AI-generated CI/CD and infrastructure configuration
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

      {isGenerating && <AIThinking message="Generating DevOps configurations..." />}

      {!isGenerating && configs.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--background-card)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
              <Settings className="h-7 w-7 text-[var(--foreground-tertiary)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">No configurations</h3>
            <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-sm">
              Generate CI/CD pipelines, Dockerfiles, and K8s manifests.
            </p>
            <Button onClick={handleGenerate} className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
              <Sparkles className="h-4 w-4" />
              Generate Configurations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {configs.map(config => (
            <Card key={config.id} className="border-[var(--border)] bg-[var(--background-card)]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Container className="h-4 w-4 text-[var(--primary)] mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-[var(--foreground)]">{config.name}</h3>
                    <p className="text-xs text-[var(--foreground-secondary)] mt-1">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-medium px-2 py-1 bg-[var(--background-elevated)] text-[var(--foreground-secondary)] rounded-md">
                    {'platform' in config ? config.platform : config.config_type}
                  </span>
                  <StatusBadge status={config.status} locked={false} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
