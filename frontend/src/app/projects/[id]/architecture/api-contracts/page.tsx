"use client";

/**
 * SDLC Brain — API Contracts Page
 *
 * Renders RESTful API contract endpoints scoped to the selected Agile item.
 */

import { use } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exportApi } from "@/lib/api";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useAPIContracts, useGenerateAPIs } from "@/hooks/use-architecture";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { AIThinking } from "@/components/shared/ai-thinking";
import {
  ArchitectureSourceSelector,
  APIContractCard,
  ArchitectureEmptyState,
  useArchitectureScope,
} from "../components";

export default function APIContractsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { isGenerating: isStreamActive, thinkingMessage, startStream } = useAIGeneration();

  const { selectedStage, selectedItemId, setSelectedStage, setSelectedItemId } = useArchitectureScope(projectId);

  const { data: contracts = [], isLoading } = useAPIContracts(projectId);
  const generateMutation = useGenerateAPIs(projectId);

  const isGenerating = generateMutation.isPending || isStreamActive;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["arch", "apis", projectId] });
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
      // Handled by toast
    } finally {
      invalidate();
    }
  };

  const scopedContracts = selectedStage === "all" || !selectedItemId
    ? contracts
    : contracts.filter((c) => c.source_id === selectedItemId);

  const overallStatus = scopedContracts.length > 0 ? scopedContracts[0].status : "draft";

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
          <h2 className="text-sm font-bold text-[var(--foreground)]">RESTful API Contracts</h2>
          <p className="text-xs text-[var(--foreground-tertiary)]">
            Showing endpoint schemas, parameters, and status codes for the selected scope
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
                "api-contracts",
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
        <AIThinking message={thinkingMessage || "Designing RESTful API endpoint contracts and JSON schemas for selected scope..."} />
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-[var(--background-card)] border border-[var(--border)]" />
      ) : scopedContracts.length > 0 ? (
        <div className="space-y-2.5">
          {scopedContracts.map((contract) => (
            <APIContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      ) : (
        <ArchitectureEmptyState
          title="No API Contracts Found for this Item"
          description={
            selectedItemId
              ? "Click generate below to design rigorous RESTful API endpoint contracts, request/response JSON schemas, and HTTP error handling for this specific Agile item."
              : "Please select an item from the dropdowns above to generate targeted API contracts."
          }
          onGenerate={handleGenerate}
          disabled={!selectedItemId || isGenerating}
        />
      )}
    </div>
  );
}
