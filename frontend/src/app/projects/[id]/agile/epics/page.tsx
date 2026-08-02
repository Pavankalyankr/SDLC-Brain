"use client";

import { useState, use } from "react";
import { toast } from "sonner";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { AIThinking } from "@/components/shared/ai-thinking";
import { VersionHistoryPanel } from "@/components/shared/version-history";
import { exportApi } from "@/lib/api";
import { ArtifactList, EmptyModuleState } from "../components";
import {
  useEpics,
  useRequirements,
  useGenerateEpics,
  useUpdateArtifactStatus,
  agileKeys,
} from "@/hooks/use-agile";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useQueryClient } from "@tanstack/react-query";

export default function EpicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyArtifactId, setHistoryArtifactId] = useState<string | null>(null);

  // Queries
  const { data: epics = [], isLoading: loadingEpics } = useEpics(projectId);
  const { data: requirements = [] } = useRequirements(projectId);

  // Mutations
  const genEpics = useGenerateEpics(projectId);
  const updateStatus = useUpdateArtifactStatus();
  const queryClient = useQueryClient();
  const { isGenerating: isStreamActive, thinkingMessage, startStream } = useAIGeneration();

  const isGenerating = genEpics.isPending || isStreamActive;
  const approvedReqs = requirements.filter((r) => r.status === "approved").length;

  const handleGenerate = async () => {
    try {
      const res = await genEpics.mutateAsync({}) as { task_id?: string };
      const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: agileKeys.epics(projectId) });
      };
      if (res?.task_id) {
        await startStream(res.task_id, "/agile", invalidate);
      }
    } catch {
      // Errors handled by mutation hook toasts
    } finally {
      queryClient.invalidateQueries({ queryKey: agileKeys.epics(projectId) });
    }
  };

  const handleApproveAll = async () => {
    const drafts = epics.filter((i) => i.status !== "approved");
    for (const item of drafts) {
      await updateStatus.mutateAsync({ type: "epics", id: item.id, status: "approved" });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleHistory = (id: string) => {
    setHistoryArtifactId(id);
    setHistoryOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <ReviewToolbar
          status="draft"
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onRegenerate={handleGenerate}
          onApprove={epics.some((i) => i.status !== "approved") ? handleApproveAll : undefined}
          onExport={async (format) => {
            toast.info(`Preparing ${format.toUpperCase()} export...`);
            try {
              await exportApi.downloadAgileExport(projectId, "epics", format);
              toast.success("Export downloaded successfully!");
            } catch {
              toast.error("Failed to download export document.");
            }
          }}
        />
      </div>

      {isGenerating && (
        <AIThinking
          message={thinkingMessage || "Generating Epics..."}
          className="mb-4"
        />
      )}

      {epics.length > 0 ? (
        <ArtifactList
          type="epics"
          items={epics}
          expandedIds={expandedIds}
          onToggle={toggleExpand}
          onStatusUpdate={(id, status) =>
            updateStatus.mutate({ type: "epics", id, status })
          }
          onApproveAll={handleApproveAll}
          onHistory={handleHistory}
        />
      ) : (
        <EmptyModuleState
          title="No epics generated"
          description={
            approvedReqs > 0
              ? `${approvedReqs} approved requirement(s) ready. Generate epics now.`
              : "Approve requirements first, then generate epics."
          }
          actionLabel="Generate Epics"
          onAction={handleGenerate}
          disabled={approvedReqs === 0}
          loading={isGenerating}
        />
      )}

      <VersionHistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        currentVersion={2}
        versions={[
          { id: "v2", version: 2, status: "review", created_at: new Date().toISOString() },
          { id: "v1", version: 1, status: "draft", created_at: new Date(Date.now() - 86400000).toISOString(), feedback: "Please refine the scope." },
        ]}
        onRestore={(vid) => console.log("Restoring", vid)}
      />
    </div>
  );
}
