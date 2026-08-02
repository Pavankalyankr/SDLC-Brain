"use client";

/**
 * SDLC Brain — Database Schema Page
 *
 * Renders database table schemas and ER diagrams scoped to the selected Agile item.
 */

import { use } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { exportApi } from "@/lib/api";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useDBSchemas, useGenerateDBSchemas } from "@/hooks/use-architecture";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { AIThinking } from "@/components/shared/ai-thinking";
import {
  ArchitectureSourceSelector,
  DBSchemaCard,
  ArchitectureEmptyState,
  useArchitectureScope,
} from "../components";

export default function DBSchemasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { isGenerating: isStreamActive, thinkingMessage, startStream } = useAIGeneration();

  const { selectedStage, selectedItemId, setSelectedStage, setSelectedItemId } = useArchitectureScope(projectId);

  const { data: schemas = [], isLoading } = useDBSchemas(projectId);
  const generateMutation = useGenerateDBSchemas(projectId);

  const isGenerating = generateMutation.isPending || isStreamActive;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["arch", "schemas", projectId] });
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

  const scopedSchemas = selectedStage === "all" || !selectedItemId
    ? schemas
    : schemas.filter((s) => s.source_id === selectedItemId);

  const overallStatus = scopedSchemas.length > 0 ? scopedSchemas[0].status : "draft";

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
          <h2 className="text-sm font-bold text-[var(--foreground)]">Database Schemas & ER Diagrams</h2>
          <p className="text-xs text-[var(--foreground-tertiary)]">
            Showing normalized table definitions, relationships, and ER charts for the selected scope
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
                "db-schema",
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
        <AIThinking message={thinkingMessage || "Modeling 3NF relational database schema tables, keys, and ER diagrams..."} />
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-[var(--background-card)] border border-[var(--border)]" />
      ) : scopedSchemas.length > 0 ? (
        <div className="space-y-3">
          {scopedSchemas.map((schema) => (
            <DBSchemaCard key={schema.id} schema={schema} />
          ))}
        </div>
      ) : (
        <ArchitectureEmptyState
          title="No Database Schema Found for this Item"
          description={
            selectedItemId
              ? "Click generate below to architect clean relational database tables, primary/foreign key relationships, indexing, and Mermaid ER diagrams for this item."
              : "Please select an item from the dropdowns above to generate targeted DB schemas."
          }
          onGenerate={handleGenerate}
          disabled={!selectedItemId || isGenerating}
        />
      )}
    </div>
  );
}
