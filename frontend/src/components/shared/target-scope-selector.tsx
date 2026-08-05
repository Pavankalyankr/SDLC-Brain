"use client";

import { useState, useEffect } from "react";
import { Filter, ChevronDown, Sparkles, Loader2, Code2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useRequirements,
  useEpics,
  useFeatures,
  useStories,
} from "@/hooks/use-agile";

export function useTargetScope(projectId: string, moduleName: string) {
  const [selectedStage, setSelectedStageState] = useState<string>("all");
  const [selectedItemId, setSelectedItemIdState] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStage = localStorage.getItem(`sdlc_brain_${moduleName}_stage_${projectId}`);
      const savedItem = localStorage.getItem(`sdlc_brain_${moduleName}_item_${projectId}`);
      if (savedStage) {
        setSelectedStageState(savedStage);
      }
      if (savedItem) {
        setSelectedItemIdState(savedItem);
      }
    }
  }, [projectId, moduleName]);

  const setSelectedStage = (stage: string) => {
    setSelectedStageState(stage);
    if (typeof window !== "undefined") {
      localStorage.setItem(`sdlc_brain_${moduleName}_stage_${projectId}`, stage);
      if (stage === "all") {
        localStorage.setItem(`sdlc_brain_${moduleName}_item_${projectId}`, "");
        setSelectedItemIdState("");
      } else {
        localStorage.removeItem(`sdlc_brain_${moduleName}_item_${projectId}`);
        setSelectedItemIdState("");
      }
    }
  };

  const setSelectedItemId = (itemId: string) => {
    setSelectedItemIdState(itemId);
    if (typeof window !== "undefined") {
      if (itemId) {
        localStorage.setItem(`sdlc_brain_${moduleName}_item_${projectId}`, itemId);
      } else {
        localStorage.removeItem(`sdlc_brain_${moduleName}_item_${projectId}`);
      }
    }
  };

  return { selectedStage, selectedItemId, setSelectedStage, setSelectedItemId };
}

interface TargetScopeSelectorProps {
  projectId: string;
  moduleName: string;
  title?: string;
  selectedStage: string;
  selectedItemId: string;
  onStageChange: (stage: string) => void;
  onItemChange: (id: string) => void;
  onAction: () => void;
  actionLabel?: string;
  isActionLoading?: boolean;
  secondaryAction?: () => void;
  secondaryActionLabel?: string;
  isSecondaryActionLoading?: boolean;
}

export function TargetScopeSelector({
  projectId,
  moduleName,
  title = "Target Agile Scope",
  selectedStage,
  selectedItemId,
  onStageChange,
  onItemChange,
  onAction,
  actionLabel = "Generate",
  isActionLoading = false,
  secondaryAction,
  secondaryActionLabel = "Generate Code",
  isSecondaryActionLoading = false,
}: TargetScopeSelectorProps) {
  const { data: requirements = [] } = useRequirements(projectId);
  const { data: epics = [] } = useEpics(projectId);
  const { data: features = [] } = useFeatures(projectId);
  const { data: stories = [] } = useStories(projectId);

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

  const isDisabled = isActionLoading || isSecondaryActionLoading || (selectedStage !== "all" && !selectedItemId);

  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)] overflow-hidden shrink-0">
      <CardContent className="p-3">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4 justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-secondary)]">
            <Filter className="h-4 w-4 text-[var(--primary)]" />
            <span>{title}:</span>
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
                  disabled={isActionLoading || isSecondaryActionLoading}
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
                  disabled={isDisabled || (selectedStage !== "all" && items.length === 0)}
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

            {/* Action Buttons */}
            <div className="flex gap-2 ml-auto xl:ml-0">
                <Button
                size="sm"
                onClick={onAction}
                disabled={isDisabled}
                className="h-8 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold flex items-center gap-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02]"
                >
                {isActionLoading ? (
                    <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Working...
                    </>
                ) : (
                    <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    {actionLabel}
                    </>
                )}
                </Button>
                
                {secondaryAction && (
                    <Button
                    size="sm"
                    variant="outline"
                    onClick={secondaryAction}
                    disabled={isDisabled}
                    className="h-8 px-4 text-xs font-semibold flex items-center gap-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] border-green-500/30 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                    {isSecondaryActionLoading ? (
                        <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                        </>
                    ) : (
                        <>
                        <Code2 className="w-3.5 h-3.5 text-green-500" />
                        {secondaryActionLabel}
                        </>
                    )}
                    </Button>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
