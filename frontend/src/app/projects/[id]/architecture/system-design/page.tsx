"use client";

/**
 * SDLC Brain — System Design Page
 *
 * Renders System Architecture designs scoped to the selected Agile item.
 */

import { use } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exportApi } from "@/lib/api";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useSystemDesigns, useGenerateDesign } from "@/hooks/use-architecture";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { AIThinking } from "@/components/shared/ai-thinking";
import {
  ArchitectureSourceSelector,
  SystemDesignCard,
  ArchitectureEmptyState,
  useArchitectureScope,
} from "../components";

export default function SystemDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { isGenerating: isStreamActive, thinkingMessage, startStream } = useAIGeneration();

  const { selectedStage, selectedItemId, setSelectedStage, setSelectedItemId } = useArchitectureScope(projectId);

  const { data: designs = [], isLoading } = useSystemDesigns(projectId);
  const generateMutation = useGenerateDesign(projectId);

  const isGenerating = generateMutation.isPending || isStreamActive;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["arch", "designs", projectId] });
  };

  const handleGenerate = async () => {
    if (!selectedItemId && selectedStage !== "all") {
      return;
    }
    try {
      const res = await generateMutation.mutateAsync({
        source_type: selectedStage === "all" ? undefined : selectedStage,
        source_id: selectedStage === "all" ? undefined : selectedItemId,
      });
      if (res.task_id) {
        await startStream(res.task_id, "/architecture", invalidate);
      }
    } catch {
      // Handled by toast in API layer
    } finally {
      invalidate();
    }
  };

  const scopedDesigns = selectedStage === "all" || !selectedItemId
    ? designs
    : designs.filter((d) => d.source_id === selectedItemId);

  const overallStatus = scopedDesigns.length > 0 ? scopedDesigns[0].status : "draft";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Target Agile Scope Selector */}
      <ArchitectureSourceSelector
        projectId={projectId}
        selectedStage={selectedStage}
        selectedItemId={selectedItemId}
        onStageChange={setSelectedStage}
        onItemChange={setSelectedItemId}
      />

      {/* Action Toolbar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--foreground)]">System Design Architecture</h2>
          <p className="text-xs text-[var(--foreground-tertiary)]">
            Showing diagrams and technical component breakdown for the selected scope
          </p>
        </div>
        <ReviewToolbar
          status={overallStatus}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onRegenerate={handleGenerate}
          onExport={async (f) => {
            toast.info(`Preparing ${f.toUpperCase()} export...`);
            try {
              await exportApi.downloadArchitectureExport(
                projectId,
                "system-design",
                f,
                selectedStage === "all" ? undefined : selectedItemId
              );
              toast.success("Export downloaded successfully!");
            } catch {
              toast.error("Failed to generate export document.");
            }
          }}
        />
      </div>

      {isGenerating && (
        <AIThinking message={thinkingMessage || "Architecting system design, selecting tech stack, and generating Mermaid diagrams..."} />
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-[var(--background-card)] border border-[var(--border)]" />
      ) : scopedDesigns.length > 0 ? (
        <div className="space-y-4">
          {scopedDesigns.map((design) => (
            <SystemDesignCard key={design.id} design={design} />
          ))}
        </div>
      ) : (
        <ArchitectureEmptyState
          title="No System Design Found for this Item"
          description={
            selectedItemId
              ? "Click generate below to create an AI-powered system architecture, tech stack recommendation, and Mermaid diagram tailored specifically for this Agile artifact."
              : "Please select an item from the dropdowns above to generate targeted system design architecture."
          }
          onGenerate={handleGenerate}
          disabled={!selectedItemId || isGenerating}
        />
      )}
    </div>
  );
}
