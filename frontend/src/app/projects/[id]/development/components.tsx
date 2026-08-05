"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTargetScope, TargetScopeSelector } from "@/components/shared/target-scope-selector";

export function useDevelopmentScope(projectId: string) {
  return useTargetScope(projectId, "dev");
}

interface SourceSelectorProps {
  projectId: string;
  selectedStage: string;
  selectedItemId: string;
  onStageChange: (stage: string) => void;
  onItemChange: (id: string) => void;
}

export function DevelopmentSourceSelector({
  projectId,
  selectedStage,
  selectedItemId,
  onStageChange,
  onItemChange,
}: SourceSelectorProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateCode = async () => {
    setGenerating(true);
    const targetName = selectedStage === "all" ? "Entire Project Workspace" : `${selectedStage}: ${selectedItemId}`;
    
    toast.info(`Initiating autonomous code generation for ${targetName}...`);
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/development/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          target_stage: selectedStage,
          target_id: selectedStage === "all" ? null : selectedItemId,
          instructions: `Generate comprehensive, production-grade source code for Agile target (${targetName}). Adhere to architectural contracts and database schemas.`
        })
      });

      if (!res.ok) throw new Error("Failed to queue code generation task.");
      const data = await res.json();
      const taskId = data.task_id;

      // Stream generation events
      const eventSource = new EventSource(`${API_BASE}/development/stream/${taskId}`);
      
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "thinking" && payload.data?.message) {
            toast.loading(`AI: ${payload.data.message}`, { id: taskId });
          } else if (payload.event === "complete") {
            toast.success(`✨ Successfully generated ${payload.data?.count || ""} code file(s) into workspace!`, { id: taskId });
            eventSource.close();
            setGenerating(false);
          } else if (payload.event === "error") {
            toast.error(`Error: ${payload.data?.message || "Generation failed"}`, { id: taskId });
            eventSource.close();
            setGenerating(false);
          }
        } catch (e) {
          console.error("Error parsing SSE event:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setGenerating(false);
      };

    } catch (err: any) {
      toast.error(err.message || "Failed to start AI generation");
      setGenerating(false);
    }
  };

  return (
    <TargetScopeSelector
      projectId={projectId}
      moduleName="dev"
      title="Target Agile Scope for Development"
      selectedStage={selectedStage}
      selectedItemId={selectedItemId}
      onStageChange={onStageChange}
      onItemChange={onItemChange}
      onAction={handleGenerateCode}
      actionLabel="Generate Code"
      isActionLoading={generating}
    />
  );
}
