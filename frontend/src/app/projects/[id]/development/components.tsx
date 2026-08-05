"use client";

import { useState, useEffect } from "react";
import { Filter, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useRequirements,
  useEpics,
  useFeatures,
  useStories,
} from "@/hooks/use-agile";

export function useDevelopmentScope(projectId: string) {
  const [selectedStage, setSelectedStageState] = useState<string>("all");
  const [selectedItemId, setSelectedItemIdState] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStage = localStorage.getItem(`sdlc_brain_dev_stage_${projectId}`);
      const savedItem = localStorage.getItem(`sdlc_brain_dev_item_${projectId}`);
      if (savedStage) {
        setSelectedStageState(savedStage);
      }
      if (savedItem) {
        setSelectedItemIdState(savedItem);
      }
    }
  }, [projectId]);

  const setSelectedStage = (stage: string) => {
    setSelectedStageState(stage);
    if (typeof window !== "undefined") {
      localStorage.setItem(`sdlc_brain_dev_stage_${projectId}`, stage);
      if (stage === "all") {
        localStorage.setItem(`sdlc_brain_dev_item_${projectId}`, "");
        setSelectedItemIdState("");
      } else {
        localStorage.removeItem(`sdlc_brain_dev_item_${projectId}`);
        setSelectedItemIdState("");
      }
    }
  };

  const setSelectedItemId = (itemId: string) => {
    setSelectedItemIdState(itemId);
    if (typeof window !== "undefined") {
      if (itemId) {
        localStorage.setItem(`sdlc_brain_dev_item_${projectId}`, itemId);
      } else {
        localStorage.removeItem(`sdlc_brain_dev_item_${projectId}`);
      }
    }
  };

  return { selectedStage, selectedItemId, setSelectedStage, setSelectedItemId };
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
  const { data: requirements = [] } = useRequirements(projectId);
  const { data: epics = [] } = useEpics(projectId);
  const { data: features = [] } = useFeatures(projectId);
  const { data: stories = [] } = useStories(projectId);
  const [generating, setGenerating] = useState(false);

  const items =
    selectedStage === "all"
      ? []
      : selectedStage === "requirements"
      ? requirements.map((i) => ({ id: i.id, title: i.title, sub: `Priority: ${i.priority || "Normal"}` }))
      : selectedStage === "epics"
      ? epics.map((i) => ({ id: i.id, title: i.title, sub: "Epic" }))
      : selectedStage === "features"
      ? features.map((i) => ({ id: i.id, title: i.title, sub: "Feature" }))
      : stories.map((i) => ({ id: i.id, title: i.title, sub: `Pts: ${i.story_points || 0}` }));

  useEffect(() => {
    if (selectedStage === "all") {
      if (selectedItemId !== "") {
        onItemChange("");
      }
      return;
    }

    if (items.length > 0 && (!selectedItemId || !items.some((i) => i.id === selectedItemId))) {
      onItemChange(items[0].id);
    } else if (items.length === 0 && selectedItemId !== "") {
      onItemChange("");
    }
  }, [selectedStage, items, selectedItemId, onItemChange]);

  const handleGenerateCode = async () => {
    setGenerating(true);
    const selectedItem = items.find((i) => i.id === selectedItemId);
    const targetName = selectedStage === "all" ? "Entire Project Workspace" : `${selectedStage}: ${selectedItem?.title || selectedItemId}`;
    
    toast.info(`Initiating autonomous code generation for ${targetName}...`);
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/development/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
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
          if (payload.type === "ai_thinking" && payload.data?.message) {
            toast.loading(`AI: ${payload.data.message}`, { id: taskId });
          } else if (payload.type === "ai_complete") {
            toast.success(`✨ Successfully generated ${payload.data?.count || ""} code file(s) into workspace!`, { id: taskId });
            eventSource.close();
            setGenerating(false);
          } else if (payload.type === "ai_error") {
            toast.error(`Error: ${payload.data?.error || payload.data?.message || "Generation failed"}`, { id: taskId });
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
    <Card className="border-[var(--border)] bg-[var(--background-card)] overflow-hidden shrink-0">
      <CardContent className="p-3">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-secondary)]">
            <Filter className="h-4 w-4 text-[var(--primary)]" />
            <span>Target Agile Scope for Development:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown 1: Agile Stage */}
            <div className="relative flex items-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mr-2">
                Stage:
              </span>
              <div className="relative">
                <select
                  value={selectedStage}
                  onChange={(e) => onStageChange(e.target.value)}
                  disabled={generating}
                  className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-1.5 pr-8 text-xs font-medium text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors disabled:opacity-50"
                >
                  <option value="all">🌐 All / Workspace</option>
                  <option value="requirements">Requirements ({requirements.length})</option>
                  <option value="epics">Epics ({epics.length})</option>
                  <option value="features">Features ({features.length})</option>
                  <option value="stories">Stories ({stories.length})</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground-secondary)]" />
              </div>
            </div>

            {/* Dropdown 2: Specific Item */}
            <div className="relative flex items-center min-w-[220px] max-w-full">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mr-2">
                Item:
              </span>
              <div className="relative flex-1">
                <select
                  value={selectedItemId}
                  onChange={(e) => onItemChange(e.target.value)}
                  disabled={generating || (selectedStage !== "all" && items.length === 0)}
                  className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-1.5 pr-8 text-xs font-medium text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors disabled:opacity-50 truncate"
                >
                  {selectedStage === "all" ? (
                    <option value="">Entire Project</option>
                  ) : items.length === 0 ? (
                    <option value="">No items found in {selectedStage}</option>
                  ) : (
                    items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} ({item.sub})
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground-secondary)]" />
              </div>
            </div>

            {/* Generate Action Button */}
            <Button
              size="sm"
              onClick={handleGenerateCode}
              disabled={generating || (selectedStage !== "all" && !selectedItemId)}
              className="h-8 px-4.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold flex items-center gap-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02]"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating Code...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  Generate Code
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
