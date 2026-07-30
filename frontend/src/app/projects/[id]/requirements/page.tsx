"use client";

/**
 * SDLC Brain — Requirements Page
 *
 * Agile Assist module: Requirements → Epics → Features → Stories
 * with hierarchical tabs, generation, review, and approval.
 */

import { useState } from "react";
import { use } from "react";
import {
  ClipboardList,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Lock,
  AlertCircle,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { AIThinking } from "@/components/shared/ai-thinking";
import { VersionHistoryPanel } from "@/components/shared/version-history";
import {
  useRequirements,
  useEpics,
  useFeatures,
  useStories,
  useGenerateRequirements,
  useGenerateEpics,
  useGenerateFeatures,
  useGenerateStories,
  useUpdateArtifactStatus,
  agileKeys,
  type Requirement,
  type Epic,
  type Feature,
  type Story,
} from "@/hooks/use-agile";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function RequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [activeTab, setActiveTab] = useState("requirements");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyArtifactId, setHistoryArtifactId] = useState<string | null>(null);

  // Queries
  const { data: requirements = [], isLoading: loadingReqs } = useRequirements(projectId);
  const { data: epics = [], isLoading: loadingEpics } = useEpics(projectId);
  const { data: features = [], isLoading: loadingFeatures } = useFeatures(projectId);
  const { data: stories = [], isLoading: loadingStories } = useStories(projectId);

  // Mutations
  const genReqs = useGenerateRequirements(projectId);
  const genEpics = useGenerateEpics(projectId);
  const genFeatures = useGenerateFeatures(projectId);
  const genStories = useGenerateStories(projectId);
  const updateStatus = useUpdateArtifactStatus();
  const queryClient = useQueryClient();
  const { isGenerating: isStreamActive, thinkingMessage, startStream } = useAIGeneration();

  const isGenerating =
    genReqs.isPending || genEpics.isPending || genFeatures.isPending || genStories.isPending || isStreamActive;

  const handleGenerate = async () => {
    let promise;
    let queryKeyFactory: any;
    
    switch (activeTab) {
      case "requirements": 
        promise = genReqs.mutateAsync({}); 
        queryKeyFactory = agileKeys.requirements;
        break;
      case "epics": 
        promise = genEpics.mutateAsync({}); 
        queryKeyFactory = agileKeys.epics;
        break;
      case "features": 
        promise = genFeatures.mutateAsync({}); 
        queryKeyFactory = agileKeys.features;
        break;
      case "stories": 
        promise = genStories.mutateAsync({}); 
        queryKeyFactory = agileKeys.stories;
        break;
    }

    if (promise) {
      try {
        const res = await promise as { task_id?: string };
        if (res.task_id) {
          await startStream(res.task_id, "/agile", () => {
            queryClient.invalidateQueries({ queryKey: queryKeyFactory(projectId) });
          });
        }
      } catch (err) {
        // Errors handled by mutation hook toasts
      }
    }
  };

  const handleApproveAll = (type: "requirements" | "epics" | "features" | "stories", items: { id: string; status: string }[]) => {
    const drafts = items.filter((i) => i.status !== "approved");
    drafts.forEach((item) => {
      updateStatus.mutate({ type, id: item.id, status: "approved" });
    });
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

  const approvedReqs = requirements.filter((r) => r.status === "approved").length;
  const approvedEpics = epics.filter((e) => e.status === "approved").length;
  const approvedFeatures = features.filter((f) => f.status === "approved").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-muted)]">
            <ClipboardList className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Agile Assist</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              Requirements → Epics → Features → Stories
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
          onExport={(format) => console.log("Export:", format)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--background-card)] border border-[var(--border)]">
          {[
            { value: "requirements", label: "Requirements", count: requirements.length },
            { value: "epics", label: "Epics", count: epics.length, gate: approvedReqs },
            { value: "features", label: "Features", count: features.length, gate: approvedEpics },
            { value: "stories", label: "Stories", count: stories.length, gate: approvedFeatures },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "gap-2 text-xs data-[state=active]:bg-[var(--background-elevated)]",
                "data-[state=active]:text-[var(--foreground)] text-[var(--foreground-secondary)]"
              )}
            >
              {tab.label}
              <Badge
                variant="secondary"
                className="h-5 min-w-5 text-[10px] bg-[var(--background)] text-[var(--foreground-tertiary)]"
              >
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* AI Thinking */}
        {isGenerating && (
          <AIThinking
            message={thinkingMessage || `Generating ${activeTab}...`}
            className="mt-4"
          />
        )}

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="mt-4">
          {requirements.length > 0 ? (
            <ArtifactList
              type="requirements"
              items={requirements}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
              onStatusUpdate={(id, status) =>
                updateStatus.mutate({ type: "requirements", id, status })
              }
              onApproveAll={() => handleApproveAll("requirements", requirements)}
              onHistory={handleHistory}
            />
          ) : (
            <EmptyModuleState
              title="No requirements generated"
              description="Upload a SOW document and generate requirements to get started."
              actionLabel="Generate Requirements"
              onAction={() => genReqs.mutate({})}
              loading={genReqs.isPending}
            />
          )}
        </TabsContent>

        {/* Epics Tab */}
        <TabsContent value="epics" className="mt-4">
          {epics.length > 0 ? (
            <ArtifactList
              type="epics"
              items={epics}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
              onStatusUpdate={(id, status) =>
                updateStatus.mutate({ type: "epics", id, status })
              }
              onApproveAll={() => handleApproveAll("epics", epics)}
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
              onAction={() => genEpics.mutate({})}
              disabled={approvedReqs === 0}
              loading={genEpics.isPending}
            />
          )}
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="mt-4">
          {features.length > 0 ? (
            <ArtifactList
              type="features"
              items={features}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
              onStatusUpdate={(id, status) =>
                updateStatus.mutate({ type: "features", id, status })
              }
              onApproveAll={() => handleApproveAll("features", features)}
              onHistory={handleHistory}
            />
          ) : (
            <EmptyModuleState
              title="No features generated"
              description={
                approvedEpics > 0
                  ? `${approvedEpics} approved epic(s) ready. Generate features now.`
                  : "Approve epics first, then generate features."
              }
              actionLabel="Generate Features"
              onAction={() => genFeatures.mutate({})}
              disabled={approvedEpics === 0}
              loading={genFeatures.isPending}
            />
          )}
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="mt-4">
          {stories.length > 0 ? (
            <ArtifactList
              type="stories"
              items={stories}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
              onStatusUpdate={(id, status) =>
                updateStatus.mutate({ type: "stories", id, status })
              }
              onApproveAll={() => handleApproveAll("stories", stories)}
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
              onAction={() => genStories.mutate({})}
              disabled={approvedFeatures === 0}
              loading={genStories.isPending}
            />
          )}
        </TabsContent>
      </Tabs>

      <VersionHistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        currentVersion={2}
        versions={[
          { id: "v2", version: 2, status: "review", created_at: new Date().toISOString() },
          { id: "v1", version: 1, status: "draft", created_at: new Date(Date.now() - 86400000).toISOString(), feedback: "Please add more details about authentication." },
        ]}
        onRestore={(vid) => console.log("Restoring", vid)}
      />
    </div>
  );
}

// ── Artifact List ──────────────────────────────────────────

interface ArtifactListProps {
  type: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    confidence: number;
    version: number;
    locked: boolean;
    priority?: string | null;
    category?: string | null;
    story_points?: number | null;
    sprint?: string | null;
    acceptance_criteria?: string | null;
  }>;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onApproveAll: () => void;
  onHistory: (id: string) => void;
}

function ArtifactList({ type, items, expandedIds, onToggle, onStatusUpdate, onApproveAll, onHistory }: ArtifactListProps) {
  const unapproved = items.filter((i) => i.status !== "approved").length;

  return (
    <div className="space-y-3">
      {/* Bulk Actions */}
      {unapproved > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-4 py-2">
          <span className="text-xs text-[var(--foreground-secondary)]">
            {unapproved} item(s) pending approval
          </span>
          <Button
            size="sm"
            onClick={onApproveAll}
            className="h-7 gap-1.5 text-xs bg-[var(--success)] hover:bg-[var(--success)]/90 text-white"
          >
            <CheckCircle2 className="h-3 w-3" />
            Approve All
          </Button>
        </div>
      )}

      {/* Artifact Cards */}
      <AnimatePresence>
        {items.map((item, index) => {
          const isExpanded = expandedIds.has(item.id);
          const MotionCard = motion.create(Card);
          return (
            <MotionCard
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              key={item.id}
              className={cn(
                "border-[var(--border)] bg-[var(--background-card)] transition-colors",
                item.locked && "border-l-2 border-l-[var(--success)]"
              )}
            >
            <CardContent className="p-4">
              {/* Header Row */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggle(item.id)}
                  className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[var(--foreground)] truncate">
                      {item.title}
                    </h3>
                    {item.priority && (
                      <Badge
                        className={cn(
                          "text-[10px] border-0",
                          item.priority === "high" && "bg-[var(--danger-muted)] text-[var(--danger)]",
                          item.priority === "medium" && "bg-[var(--warning-muted)] text-[var(--warning)]",
                          item.priority === "low" && "bg-[var(--background-elevated)] text-[var(--foreground-tertiary)]"
                        )}
                      >
                        {item.priority}
                      </Badge>
                    )}
                    {item.category && (
                      <Badge className="text-[10px] bg-[var(--background-elevated)] text-[var(--foreground-tertiary)] border-0">
                        {item.category}
                      </Badge>
                    )}
                    {item.story_points && (
                      <Badge className="text-[10px] bg-[var(--primary-muted)] text-[var(--primary)] border-0">
                        {item.story_points} pts
                      </Badge>
                    )}
                    {item.sprint && (
                      <Badge className="text-[10px] bg-[var(--background-elevated)] text-[var(--foreground-tertiary)] border-0">
                        {item.sprint}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ConfidenceBadge confidence={item.confidence} />
                  <StatusBadge status={item.status} locked={item.locked} />

                  {!item.locked && (
                    <div className="flex gap-1">
                      {item.status === "draft" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onStatusUpdate(item.id, "review")}
                          className="h-7 text-[10px] text-[var(--warning)] hover:bg-[var(--warning-muted)]"
                        >
                          Review
                        </Button>
                      )}
                      {(item.status === "draft" || item.status === "review") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onStatusUpdate(item.id, "approved")}
                          className="h-7 text-[10px] text-[var(--success)] hover:bg-[var(--success-muted)]"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-3 ml-7 space-y-2 animate-fade-in">
                  <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                  {item.acceptance_criteria && (
                    <div className="mt-2">
                      <p className="text-[10px] font-medium text-[var(--foreground-tertiary)] uppercase tracking-wider mb-1">
                        Acceptance Criteria
                      </p>
                      <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-wrap">
                        {item.acceptance_criteria}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-2 text-[10px] text-[var(--foreground-tertiary)]">
                    <span>v{item.version}</span>
                    <span>ID: {item.id.slice(0, 8)}</span>
                    <button onClick={() => onHistory(item.id)} className="hover:text-[var(--primary)] transition-colors flex items-center gap-1">
                      <History className="h-3 w-3" /> View History
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </MotionCard>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────

function EmptyModuleState({
  title,
  description,
  actionLabel,
  onAction,
  disabled,
  loading,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)]">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
          <ClipboardList className="h-7 w-7 text-[var(--foreground-tertiary)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">{title}</h3>
        <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-sm">{description}</p>
        <Button
          onClick={onAction}
          disabled={disabled || loading}
          className={cn(
            "gap-2",
            disabled
              ? "bg-[var(--background-elevated)] text-[var(--foreground-tertiary)]"
              : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
          )}
        >
          <Sparkles className={cn("h-4 w-4", loading && "animate-spin")} />
          {loading ? "Generating..." : actionLabel}
        </Button>
        {disabled && (
          <p className="text-[10px] text-[var(--foreground-tertiary)] mt-3 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Approve parent artifacts to unlock generation
          </p>
        )}
      </CardContent>
    </Card>
  );
}
