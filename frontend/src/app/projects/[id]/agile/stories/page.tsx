"use client";

import { useState, use } from "react";
import { toast } from "sonner";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { exportApi } from "@/lib/api";
import { AIThinking } from "@/components/shared/ai-thinking";
import { VersionHistoryPanel } from "@/components/shared/version-history";
import { ArtifactList, EmptyModuleState } from "../components";
import {
  useStories,
  useFeatures,
  useGenerateStories,
  useUpdateArtifactStatus,
  useUpdateStoryMetadata,
  agileKeys,
} from "@/hooks/use-agile";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useQueryClient } from "@tanstack/react-query";

export default function StoriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyArtifactId, setHistoryArtifactId] = useState<string | null>(null);

  // Queries
  const { data: stories = [], isLoading: loadingStories } = useStories(projectId);
  const { data: features = [] } = useFeatures(projectId);

  // Mutations
  const genStories = useGenerateStories(projectId);
  const updateStatus = useUpdateArtifactStatus();
  const updateMetadata = useUpdateStoryMetadata();
  const queryClient = useQueryClient();
  const { isGenerating: isStreamActive, thinkingMessage, startStream } = useAIGeneration();

  const isGenerating = genStories.isPending || isStreamActive;
  const approvedFeatures = features.filter((f) => f.status === "approved").length;

  const handleGenerate = async () => {
    try {
      const res = await genStories.mutateAsync({}) as { task_id?: string };
      const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: agileKeys.stories(projectId) });
      };
      if (res?.task_id) {
        await startStream(res.task_id, "/agile", invalidate);
      }
    } catch {
      // Errors handled by mutation hook toasts
    } finally {
      queryClient.invalidateQueries({ queryKey: agileKeys.stories(projectId) });
    }
  };

  const handleApproveAll = async () => {
    const drafts = stories.filter((i) => i.status !== "approved");
    for (const item of drafts) {
      await updateStatus.mutateAsync({ type: "stories", id: item.id, status: "approved" });
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
          onApprove={stories.some((i) => i.status !== "approved") ? handleApproveAll : undefined}
          onExport={async (format) => {
            toast.info(`Preparing ${format.toUpperCase()} export...`);
            try {
              await exportApi.downloadAgileExport(projectId, "stories", format);
              toast.success("Export downloaded successfully!");
            } catch {
              toast.error("Failed to download export document.");
            }
          }}
        />
      </div>

      {isGenerating && (
        <AIThinking
          message={thinkingMessage || "Generating Stories..."}
          className="mb-4"
        />
      )}

      {stories.length > 0 ? (
        <ArtifactList
          type="stories"
          items={stories}
          expandedIds={expandedIds}
          onToggle={toggleExpand}
          onStatusUpdate={(id, status) =>
            updateStatus.mutate({ type: "stories", id, status })
          }
          onMetadataUpdate={(id, data) => {
            updateMetadata.mutate({ id, data });
          }}
          onApproveAll={handleApproveAll}
          onHistory={handleHistory}
        />
      ) : (
        <EmptyModuleState
          title="No stories generated"
          description={
            approvedFeatures > 0
              ? `${approvedFeatures} approved feature(s) ready. Generate stories now.`
              : "Approve features first, then generate stories."
          }
          actionLabel="Generate Stories"
          onAction={handleGenerate}
          disabled={approvedFeatures === 0}
          loading={isGenerating}
        />
      )}

      <VersionHistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        currentVersion={2}
        versions={[
          { id: "v2", version: 2, status: "review", created_at: new Date().toISOString() },
          { id: "v1", version: 1, status: "draft", created_at: new Date(Date.now() - 86400000).toISOString(), feedback: "Update acceptance criteria." },
        ]}
        onRestore={(vid) => console.log("Restoring", vid)}
      />
    </div>
  );
}
