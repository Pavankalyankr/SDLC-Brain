"use client";

import { useState } from "react";
import { use } from "react";
import {
  Activity,
  Sparkles,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { AIThinking } from "@/components/shared/ai-thinking";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useIncidents, useAnalyzeIncident, prodKeys, type Incident } from "@/hooks/use-production";
import { useQueryClient } from "@tanstack/react-query";

export default function ProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { startStream, isGenerating } = useAIGeneration();
  
  const { data: incidents = [] } = useIncidents(projectId);
  const analyzeProd = useAnalyzeIncident(projectId);

  const handleGenerate = async () => {
    try {
      const res = await analyzeProd.mutateAsync(undefined) as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/production", () => {
          queryClient.invalidateQueries({ queryKey: prodKeys.incidents(projectId) });
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <Activity className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Production Assist</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              AI incident analysis and runbook generation
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

      {isGenerating && <AIThinking message="Analyzing incident data..." />}

      {!isGenerating && incidents.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--background-card)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
              <AlertTriangle className="h-7 w-7 text-[var(--foreground-tertiary)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">No active incidents</h3>
            <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-sm">
              Trigger an AI analysis to investigate logs and generate resolution steps.
            </p>
            <Button onClick={handleGenerate} className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
              <Sparkles className="h-4 w-4" />
              Analyze Incidents
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map(incident => (
            <Card key={incident.id} className="border-[var(--border)] bg-[var(--background-card)]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-[var(--foreground)]">{incident.title}</h3>
                    <p className="text-xs text-[var(--foreground-secondary)] mt-1">{incident.description}</p>
                    {incident.root_cause && (
                      <div className="mt-2 text-[10px] text-[var(--foreground-tertiary)] bg-[var(--background-elevated)] p-2 rounded">
                        <span className="font-medium text-[var(--foreground-secondary)] block mb-1">Root Cause:</span>
                        {incident.root_cause}
                      </div>
                    )}
                    {incident.resolution && (
                      <div className="mt-2 text-[10px] text-green-400 bg-green-500/10 p-2 rounded">
                        <span className="font-medium text-green-500 block mb-1">Resolution:</span>
                        {incident.resolution}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-medium px-2 py-1 bg-rose-500/10 text-rose-500 rounded-md">
                    {incident.severity}
                  </span>
                  <span className="text-[10px] uppercase font-medium px-2 py-1 bg-[var(--background-elevated)] text-[var(--foreground)] rounded-md border border-[var(--border)]">
                    {incident.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
