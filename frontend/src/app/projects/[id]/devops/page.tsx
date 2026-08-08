"use client";

import { useState } from "react";
import { use } from "react";
import {
  Rocket,
  Sparkles,
  Container,
  FileCode2,
  FileText,
  ClipboardCheck,
  Tag,
  ChevronRight,
  Copy,
  X,
  BookOpen,
  ArrowUpCircle,
  Package,
  GitBranch,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { AIThinking } from "@/components/shared/ai-thinking";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import {
  usePipelines,
  useInfra,
  useImageVersions,
  useReleases,
  useGenerateDevOps,
  useGenerateRelease,
  devopsKeys,
  type PipelineConfig,
  type InfraConfig,
  type ImageVersion,
  type ReleaseNote,
} from "@/hooks/use-devops";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileExplorer } from "@/components/development/file-explorer";

/* ── helpers ── */

const ARTIFACT_ICONS: Record<string, any> = {
  dockerfile: Container,
  docker_compose: Container,
  github_actions: GitBranch,
  env_template: FileText,
  dockerignore: FileText,
  k8s: Package,
};

function getIcon(config: PipelineConfig | InfraConfig) {
  if ("platform" in config) return ARTIFACT_ICONS[config.platform] || FileCode2;
  return ARTIFACT_ICONS[(config as InfraConfig).config_type] || FileCode2;
}

function getLabel(config: PipelineConfig | InfraConfig) {
  if ("platform" in config) return config.platform.replace("_", " ");
  return (config as InfraConfig).config_type.replace("_", " ");
}

/* ── step indicator ── */
const STEPS = [
  { id: 1, label: "Analyze & Generate", icon: Sparkles },
  { id: 2, label: "Review Artifacts", icon: ClipboardCheck },
  { id: 3, label: "Release Assist", icon: Tag },
];

/* ── component ── */

export default function DevOpsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { startStream, isGenerating } = useAIGeneration();

  const { data: pipelines = [] } = usePipelines(projectId);
  const { data: infra = [] } = useInfra(projectId);
  const { data: imageVersions = [] } = useImageVersions(projectId);
  const { data: releases = [] } = useReleases(projectId);
  const genDevOps = useGenerateDevOps(projectId);
  const genRelease = useGenerateRelease(projectId);

  const allConfigs = [...pipelines, ...infra];
  const hasConfigs = allConfigs.length > 0;
  const hasRelease = releases.length > 0;

  const [activeStep, setActiveStep] = useState(hasRelease ? 3 : hasConfigs ? 2 : 1);
  const [selectedConfig, setSelectedConfig] = useState<
    (PipelineConfig | InfraConfig) | null
  >(null);
  const [releaseChanges, setReleaseChanges] = useState("");
  const [releaseVersion, setReleaseVersion] = useState("");
  const [isRelGenerating, setIsRelGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: devopsKeys.pipelines(projectId) });
    queryClient.invalidateQueries({ queryKey: devopsKeys.infra(projectId) });
    queryClient.invalidateQueries({ queryKey: devopsKeys.images(projectId) });
    queryClient.invalidateQueries({ queryKey: devopsKeys.releases(projectId) });
  };

  const handleGenerate = async () => {
    try {
      const res = (await genDevOps.mutateAsync({})) as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/devops", invalidateAll);
      }
    } catch {
      /* toast handles */
    } finally {
      invalidateAll();
      setActiveStep(2);
    }
  };

  const handleGenerateRelease = async () => {
    setIsRelGenerating(true);
    try {
      const res = (await genRelease.mutateAsync({
        version: releaseVersion || undefined,
        changes: releaseChanges || undefined,
      })) as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/devops", invalidateAll);
      }
    } catch {
      /* toast handles */
    } finally {
      invalidateAll();
      setIsRelGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  /* ─────────────── render ─────────────── */
  return (
    <div className="flex-1 flex flex-col pt-1 pb-4 px-4 overflow-hidden min-h-0 w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
            <Rocket className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
              DevOps & Release Assist
            </h1>
            <p className="text-sm text-[var(--foreground-secondary)] mt-0.5">
              Analyze → Generate Artifacts → Release
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-8 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold rounded-lg"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-yellow-300" />
            {isGenerating ? "Generating..." : "Analyze & Generate"}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-4 w-full relative overflow-hidden">
        {/* LEFT: File Explorer */}
        <div className="w-72 shrink-0 h-full relative overflow-hidden flex flex-col">
          <FileExplorer projectId={projectId} onFileSelect={setSelectedFile} />
        </div>

        {/* RIGHT: Main Content */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden flex flex-col">

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isDone =
            (step.id === 1 && hasConfigs) ||
            (step.id === 2 && hasConfigs) ||
            (step.id === 3 && hasRelease);
          return (
            <div key={step.id} className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30"
                    : isDone
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-[var(--background-elevated)] text-[var(--foreground-tertiary)] border border-[var(--border)]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-[var(--border)] text-[var(--foreground-tertiary)]"
                  }`}
                >
                  {isDone && !isActive ? "✓" : step.id}
                </span>
                <Icon className="h-3.5 w-3.5" />
                {step.label}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
        {isGenerating && (
          <AIThinking message="Analyzing project and generating DevOps artifacts..." />
        )}

        {/* ── STEP 1: Empty state / Generate ── */}
        {!isGenerating && activeStep === 1 && !hasConfigs && (
          <Card className="border-[var(--border)] bg-[var(--background-card)]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
                <Rocket className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
                Ready to Analyze Your Project
              </h3>
              <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-md">
                The AI will detect your language, framework, and dependencies, then generate
                Dockerfile, docker-compose, GitHub Actions CI/CD, and .env template.
              </p>
              <Button
                onClick={handleGenerate}
                className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
              >
                <Sparkles className="h-4 w-4" />
                Analyze & Generate
              </Button>
            </CardContent>
          </Card>
        )}

        {/* If step 1 is clicked but we already have configs, show the summary */}
        {!isGenerating && activeStep === 1 && hasConfigs && (
          <div className="space-y-4">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    Project Analyzed Successfully
                  </span>
                </div>
                <p className="text-xs text-[var(--foreground-secondary)] ml-8">
                  Generated {pipelines.length} pipeline(s) and {infra.length} infrastructure file(s).
                  {imageVersions.length > 0 && ` Tracking ${imageVersions.length} container image(s).`}
                </p>
                <div className="flex gap-2 mt-3 ml-8">
                  <Button size="sm" onClick={() => setActiveStep(2)} className="h-7 text-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
                    Review Artifacts →
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isGenerating} className="h-7 text-xs">
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 2: Review Artifacts ── */}
        {!isGenerating && activeStep === 2 && (
          <div className="space-y-4">
            {allConfigs.length === 0 ? (
              <Card className="border-[var(--border)] bg-[var(--background-card)]">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-xs text-[var(--foreground-secondary)] mb-4">
                    No artifacts generated yet. Run Analyze & Generate first.
                  </p>
                  <Button size="sm" onClick={() => { setActiveStep(1); handleGenerate(); }} className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Analyze & Generate
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {allConfigs.map((config) => {
                    const Icon = getIcon(config);
                    const label = getLabel(config);
                    return (
                      <Card
                        key={config.id}
                        className="border-[var(--border)] bg-[var(--background-elevated)] hover:border-[var(--primary)] hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => setSelectedConfig(config)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-cyan-400" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-[var(--foreground)] line-clamp-1">
                                  {config.name}
                                </h3>
                                <span className="text-[10px] uppercase font-bold text-[var(--foreground-tertiary)]">
                                  {label}
                                </span>
                              </div>
                            </div>
                            <StatusBadge status={config.status} locked={config.locked} />
                          </div>
                          <p className="text-xs text-[var(--foreground-secondary)] line-clamp-2">
                            {config.description}
                          </p>
                          <div className="mt-3 text-[10px] text-[var(--primary)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to view & copy →
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Image Version Registry */}
                {imageVersions.length > 0 && (
                  <Card className="border-[var(--border)] bg-[var(--background-card)] mt-6">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">
                          Container Image Registry
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[var(--border)]">
                              <th className="text-left py-2 px-3 font-semibold text-[var(--foreground-secondary)]">Service</th>
                              <th className="text-left py-2 px-3 font-semibold text-[var(--foreground-secondary)]">Image</th>
                              <th className="text-left py-2 px-3 font-semibold text-[var(--foreground-secondary)]">Current</th>
                              <th className="text-left py-2 px-3 font-semibold text-[var(--foreground-secondary)]">Previous</th>
                              <th className="text-left py-2 px-3 font-semibold text-[var(--foreground-secondary)]">Base</th>
                              <th className="text-left py-2 px-3 font-semibold text-[var(--foreground-secondary)]">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {imageVersions.map((iv: ImageVersion) => (
                              <tr key={iv.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--background-elevated)]">
                                <td className="py-2 px-3 font-medium text-[var(--foreground)]">{iv.service_name}</td>
                                <td className="py-2 px-3 font-mono text-[var(--foreground-secondary)]">{iv.image_name}</td>
                                <td className="py-2 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-mono font-bold">{iv.current_version}</span>
                                </td>
                                <td className="py-2 px-3 font-mono text-[var(--foreground-tertiary)]">{iv.previous_version || "—"}</td>
                                <td className="py-2 px-3 font-mono text-[var(--foreground-secondary)]">{iv.base_image || "—"}</td>
                                <td className="py-2 px-3">
                                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                    iv.status === "new" ? "bg-emerald-500/15 text-emerald-400" :
                                    iv.status === "outdated" ? "bg-amber-500/15 text-amber-400" :
                                    "bg-[var(--background-elevated)] text-[var(--foreground-tertiary)]"
                                  }`}>
                                    {iv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setActiveStep(3)} className="h-8 text-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
                    Continue to Release Assist →
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STEP 3: Release Assist ── */}
        {!isGenerating && activeStep === 3 && (
          <div className="space-y-4">
            {/* Release form */}
            <Card className="border-[var(--border)] bg-[var(--background-card)]">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Generate Release Notes
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[var(--foreground-tertiary)] mb-1 block">
                      Version (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. v1.2.0"
                      value={releaseVersion}
                      onChange={(e) => setReleaseVersion(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[var(--foreground-tertiary)] mb-1 block">
                      Changes Summary (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Added user auth, fixed payment bug"
                      value={releaseChanges}
                      onChange={(e) => setReleaseChanges(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerateRelease}
                  disabled={isRelGenerating || isGenerating}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
                  {isRelGenerating ? "Generating..." : "Generate Release"}
                </Button>
              </CardContent>
            </Card>

            {/* Existing releases */}
            {releases.map((rel: ReleaseNote) => (
              <Card key={rel.id} className="border-[var(--border)] bg-[var(--background-card)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-mono font-bold text-sm">
                      {rel.version}
                    </span>
                    <span className="text-[10px] text-[var(--foreground-tertiary)]">
                      {new Date(rel.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {rel.release_notes && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold text-[var(--foreground)]">Release Notes</span>
                      </div>
                      <div className="bg-[var(--background-elevated)] rounded-lg p-3 border border-[var(--border)]">
                        <pre className="text-xs text-[var(--foreground-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                          {rel.release_notes}
                        </pre>
                      </div>
                    </div>
                  )}

                  {rel.deploy_instructions && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ClipboardCheck className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-semibold text-[var(--foreground)]">Deployment Instructions</span>
                      </div>
                      <div className="bg-[var(--background-elevated)] rounded-lg p-3 border border-[var(--border)]">
                        <pre className="text-xs text-[var(--foreground-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                          {rel.deploy_instructions}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Config Preview Modal ── */}
      <Dialog
        open={!!selectedConfig}
        onOpenChange={(open) => !open && setSelectedConfig(null)}
      >
        <DialogContent className="max-w-[900px] w-[90vw] max-h-[80vh] p-0 gap-0 bg-[var(--background-card)] border-[var(--border)] flex flex-col overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b border-[var(--border)] bg-[var(--background-elevated)] shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-[var(--foreground)]">
              <FileCode2 className="h-4 w-4 text-cyan-400" />
              {selectedConfig?.name}
            </DialogTitle>
            <div className="flex items-center gap-2 mr-8">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  selectedConfig && copyToClipboard(selectedConfig.config_content)
                }
                className="h-7 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-[var(--background)]">
            {selectedConfig && (
              <pre className="p-4 text-xs font-mono text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                {selectedConfig.config_content}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
      </div>
    </div>
  );
}
