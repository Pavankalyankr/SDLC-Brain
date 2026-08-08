"use client";

import { useState } from "react";
import { use } from "react";
import {
  AlertTriangle,
  Sparkles,
  Search,
  FileCode2,
  ShieldAlert,
  BookOpen,
  Wrench,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Zap,
  Bug,
  Terminal,
  GitPullRequest,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CodeEditor } from "@/components/development/code-editor";
import { AIThinking } from "@/components/shared/ai-thinking";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import {
  useIncidents,
  useAnalyses,
  useAnalyzeIncident,
  useUpdateAnalysisStatus,
  useApplyFix,
  productionKeys,
  type Incident,
  type IncidentAnalysis,
} from "@/hooks/use-production";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileExplorer } from "@/components/development/file-explorer";

/* ── severity config ── */
const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/15", icon: Flame },
  high: { color: "text-orange-400", bg: "bg-orange-500/15", icon: AlertTriangle },
  medium: { color: "text-amber-400", bg: "bg-amber-500/15", icon: Zap },
  low: { color: "text-blue-400", bg: "bg-blue-500/15", icon: Bug },
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-500/15 text-red-400",
  investigating: "bg-amber-500/15 text-amber-400",
  rca_complete: "bg-cyan-500/15 text-cyan-400",
  resolved: "bg-emerald-500/15 text-emerald-400",
  closed: "bg-[var(--background-elevated)] text-[var(--foreground-tertiary)]",
};

/* ── component ── */
export default function ProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { startStream, isGenerating } = useAIGeneration();

  const { data: incidents = [] } = useIncidents(projectId);
  const analyzeIncident = useAnalyzeIncident(projectId);
  const updateAnalysisStatus = useUpdateAnalysisStatus();
  const applyFix = useApplyFix();

  const handleApplyFix = async (analysisId: string) => {
    try {
      const res = (await applyFix.mutateAsync(analysisId)) as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/production", invalidateAll);
      }
    } catch {
      /* toast handles */
    } finally {
      invalidateAll();
    }
  };

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formLogs, setFormLogs] = useState("");
  const [formSeverity, setFormSeverity] = useState("medium");
  const [formService, setFormService] = useState("");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: productionKeys.incidents(projectId) });
  };

  const handleAnalyze = async () => {
    if (!formLogs.trim() && !formTitle.trim()) {
      toast.error("Please provide a title or paste logs/stack trace");
      return;
    }
    setShowForm(false);
    try {
      const res = (await analyzeIncident.mutateAsync({
        title: formTitle || undefined,
        raw_logs: formLogs || undefined,
        severity: formSeverity,
        service: formService || undefined,
      })) as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/production", invalidateAll);
      }
    } catch {
      /* toast handles */
    } finally {
      invalidateAll();
      setFormTitle("");
      setFormLogs("");
      setFormService("");
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-1 pb-4 px-4 overflow-hidden min-h-0 w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
              Production Assist
            </h1>
            <p className="text-sm text-[var(--foreground-secondary)] mt-0.5">
              Incident → RCA → Runbook → Fix → SDLC Handoff
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
          Report Incident
        </Button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 min-h-0 flex gap-4 w-full relative overflow-hidden">
        {/* LEFT: File Explorer */}
        <div className="w-64 shrink-0 h-full relative overflow-hidden flex flex-col">
          <FileExplorer projectId={projectId} onFileSelect={setSelectedFile} />
        </div>

        {/* CENTER: Incident List + Form */}
        <div className="w-80 shrink-0 h-full flex flex-col overflow-hidden">
          {/* New Incident Form */}
          {showForm && (
            <Card className="border-red-500/30 bg-[var(--background-card)] mb-3 shrink-0">
              <CardContent className="p-3 space-y-2">
                <h3 className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  Report New Incident
                </h3>
                <input
                  type="text"
                  placeholder="Incident title (e.g. Redis cache timeout)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-red-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none"
                  >
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🔵 Low</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Service name"
                    value={formService}
                    onChange={(e) => setFormService(e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-2 py-1.5 text-xs text-[var(--foreground)] outline-none focus:border-red-500"
                  />
                </div>
                <textarea
                  placeholder="Paste stack trace, error logs, or describe the incident..."
                  value={formLogs}
                  onChange={(e) => setFormLogs(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-xs text-[var(--foreground)] font-mono outline-none focus:border-red-500 resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isGenerating}
                    className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white flex-1"
                  >
                    <Search className="h-3 w-3 mr-1" />
                    {isGenerating ? "Analyzing..." : "Investigate"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="h-7 text-xs">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isGenerating && <AIThinking message="Running Root Cause Analysis..." />}

          {/* Incident List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--border)] space-y-2">
            {incidents.length === 0 && !showForm && (
              <Card className="border-[var(--border)] bg-[var(--background-card)]">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xs font-semibold text-[var(--foreground)] mb-1">No Active Incidents</h3>
                  <p className="text-[10px] text-[var(--foreground-secondary)] mb-4 max-w-[200px]">
                    Report an incident to trigger AI-powered Root Cause Analysis
                  </p>
                  <Button size="sm" onClick={() => setShowForm(true)} className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Report Incident
                  </Button>
                </CardContent>
              </Card>
            )}

            {incidents.map((inc: Incident) => {
              const sev = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.medium;
              const SevIcon = sev.icon;
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <Card
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`border-[var(--border)] cursor-pointer transition-all hover:border-[var(--primary)] ${
                    isSelected ? "border-[var(--primary)] bg-[var(--primary)]/5" : "bg-[var(--background-elevated)]"
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className={`h-6 w-6 rounded-lg ${sev.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <SevIcon className={`h-3.5 w-3.5 ${sev.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-[var(--foreground)] line-clamp-1">{inc.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${STATUS_COLORS[inc.status] || STATUS_COLORS.open}`}>
                            {inc.status.replace("_", " ")}
                          </span>
                          {inc.service && (
                            <span className="text-[9px] text-[var(--foreground-tertiary)]">{inc.service}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--foreground-tertiary)] mt-1">
                          {new Date(inc.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Analysis Detail */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden flex flex-col">
          {selectedIncident ? (
            <IncidentDetail
              incident={selectedIncident}
              projectId={projectId}
              onApprove={(analysisId) =>
                updateAnalysisStatus.mutate(
                  { analysisId, status: "approved" },
                  { onSuccess: () => invalidateAll() }
                )
              }
              onReject={(analysisId) =>
                updateAnalysisStatus.mutate(
                  { analysisId, status: "rejected" },
                  { onSuccess: () => invalidateAll() }
                )
              }
              onApplyFix={handleApplyFix}
            />
          ) : (
            <Card className="border-[var(--border)] bg-[var(--background-card)] flex-1">
              <CardContent className="flex flex-col items-center justify-center h-full text-center">
                <Search className="h-8 w-8 text-[var(--foreground-tertiary)] mb-3" />
                <p className="text-xs text-[var(--foreground-secondary)]">
                  Select an incident to view the full RCA analysis
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent showCloseButton={true} className="sm:max-w-5xl w-full h-[85vh] p-4 flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
            <DialogDescription>
              Viewing and editing <code className="text-xs bg-muted px-1 py-0.5 rounded">{selectedFile}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-[var(--border)] shadow-sm">
            <CodeEditor projectId={projectId} selectedFile={selectedFile} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Incident Detail Component ── */
function IncidentDetail({
  incident,
  projectId,
  onApprove,
  onReject,
  onApplyFix,
}: {
  incident: Incident;
  projectId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onApplyFix: (id: string) => void;
}) {
  const { data: analyses = [] } = useAnalyses(incident.id);
  const analysis = analyses[0] as IncidentAnalysis | undefined;
  const [activeTab, setActiveTab] = useState<"rca" | "runbook" | "patch">("rca");

  const sev = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.medium;
  const SevIcon = sev.icon;

  const tabs = [
    { id: "rca" as const, label: "Root Cause", icon: Search },
    { id: "runbook" as const, label: "Runbook", icon: BookOpen },
    { id: "patch" as const, label: "Proposed Fix", icon: GitPullRequest },
  ];

  let affectedFiles: string[] = [];
  if (analysis?.affected_files) {
    try {
      affectedFiles = JSON.parse(analysis.affected_files);
    } catch {
      affectedFiles = [];
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Incident Header */}
      <Card className="border-[var(--border)] bg-[var(--background-card)] shrink-0 mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-lg ${sev.bg} flex items-center justify-center shrink-0`}>
                <SevIcon className={`h-4 w-4 ${sev.color}`} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">{incident.title}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${sev.bg} ${sev.color}`}>
                    {incident.severity}
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${STATUS_COLORS[incident.status]}`}>
                    {incident.status.replace("_", " ")}
                  </span>
                  {incident.service && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--background-elevated)] text-[var(--foreground-secondary)]">
                      {incident.service}
                    </span>
                  )}
                  {analysis?.classification && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-mono">
                      {analysis.classification}
                    </span>
                  )}
                  {analysis && (
                    <span className="text-[10px] text-[var(--foreground-tertiary)]">
                      Confidence: {Math.round((analysis.confidence || 0) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            {analysis && analysis.status === "pending_review" && (
              <div className="flex gap-1.5 shrink-0">
                <Button
                  size="sm"
                  onClick={() => onApprove(analysis.id)}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Approve Fix
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(analysis.id)}
                  className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="h-3 w-3 mr-1" /> Reject
                </Button>
              </div>
            )}
            {analysis?.status === "approved" && (
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                  ✓ Approved
                </span>
                <Button
                  size="sm"
                  onClick={() => onApplyFix(analysis.id)}
                  className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white shadow shadow-purple-500/20"
                >
                  <Sparkles className="h-3 w-3 mr-1" /> Apply Fix
                </Button>
              </div>
            )}
            {analysis?.status === "applied" && (
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-blue-500/15 text-blue-400">
                ✓ Fix Applied
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      {analysis ? (
        <>
          <div className="flex gap-1 mb-3 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30"
                      : "bg-[var(--background-elevated)] text-[var(--foreground-tertiary)] border border-[var(--border)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--border)]">
            {activeTab === "rca" && (
              <div className="space-y-3">
                {/* Root Cause */}
                <Card className="border-[var(--border)] bg-[var(--background-card)]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Search className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-xs font-semibold text-[var(--foreground)]">Root Cause Analysis</span>
                    </div>
                    <div className="bg-[var(--background-elevated)] rounded-lg p-3 border border-[var(--border)]">
                      <pre className="text-xs text-[var(--foreground-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                        {analysis.root_cause}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Impact */}
                {analysis.impact && (
                  <Card className="border-[var(--border)] bg-[var(--background-card)]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-xs font-semibold text-[var(--foreground)]">Impact Analysis</span>
                      </div>
                      <div className="bg-[var(--background-elevated)] rounded-lg p-3 border border-[var(--border)]">
                        <pre className="text-xs text-[var(--foreground-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                          {analysis.impact}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Affected Files */}
                {affectedFiles.length > 0 && (
                  <Card className="border-[var(--border)] bg-[var(--background-card)]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <FileCode2 className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-xs font-semibold text-[var(--foreground)]">Affected Files</span>
                      </div>
                      <div className="space-y-1">
                        {affectedFiles.map((f: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-[var(--background-elevated)] border border-[var(--border)]">
                            <FileCode2 className="h-3 w-3 text-[var(--foreground-tertiary)]" />
                            <span className="text-xs font-mono text-[var(--foreground-secondary)]">{f}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Raw Logs */}
                {incident.raw_logs && (
                  <Card className="border-[var(--border)] bg-[var(--background-card)]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Terminal className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />
                        <span className="text-xs font-semibold text-[var(--foreground)]">Raw Logs</span>
                      </div>
                      <div className="bg-[#0d1117] rounded-lg p-3 border border-[var(--border)] max-h-48 overflow-y-auto">
                        <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono leading-relaxed">
                          {incident.raw_logs}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "runbook" && (
              <Card className="border-[var(--border)] bg-[var(--background-card)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-[var(--foreground)]">Mitigation Runbook</span>
                  </div>
                  <div className="bg-[var(--background-elevated)] rounded-lg p-3 border border-[var(--border)]">
                    <pre className="text-xs text-[var(--foreground-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                      {analysis.mitigation_runbook || "No runbook generated."}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "patch" && (
              <div className="space-y-3">
                {/* Proposed Fix Explanation */}
                <Card className="border-[var(--border)] bg-[var(--background-card)]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Wrench className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-xs font-semibold text-[var(--foreground)]">Proposed Fix</span>
                    </div>
                    <div className="bg-[var(--background-elevated)] rounded-lg p-3 border border-[var(--border)]">
                      <pre className="text-xs text-[var(--foreground-secondary)] whitespace-pre-wrap font-mono leading-relaxed">
                        {analysis.proposed_fix || "No fix proposed."}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Code Patch / Diff */}
                {analysis.code_patch && (
                  <Card className="border-[var(--border)] bg-[var(--background-card)]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <GitPullRequest className="h-3.5 w-3.5 text-purple-400" />
                          <span className="text-xs font-semibold text-[var(--foreground)]">Code Patch</span>
                        </div>
                        {analysis.status === "pending_review" && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> Awaiting Approval
                          </span>
                        )}
                      </div>
                      <div className="bg-[#0d1117] rounded-lg p-3 border border-[var(--border)] overflow-x-auto">
                        <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                          {analysis.code_patch.split("\n").map((line: string, i: number) => {
                            let color = "text-gray-400";
                            const trimmedLine = line.trimStart();
                            if (trimmedLine.startsWith("+") && !trimmedLine.startsWith("+++")) color = "text-emerald-400";
                            else if (trimmedLine.startsWith("-") && !trimmedLine.startsWith("---")) color = "text-red-400";
                            else if (trimmedLine.startsWith("@@")) color = "text-cyan-400";
                            else if (trimmedLine.startsWith("---") || trimmedLine.startsWith("+++")) color = "text-amber-400";
                            return (
                              <span key={i} className={color}>
                                {line}
                                {"\n"}
                              </span>
                            );
                          })}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Human Approval Buttons */}
                {analysis.status === "pending_review" && (
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-[var(--foreground)]">
                            Human Approval Required
                          </h3>
                          <p className="text-[10px] text-[var(--foreground-secondary)] mt-0.5">
                            Review the proposed fix and code patch before applying. Approved patches can be sent to Code Review or Development.
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => onApprove(analysis.id)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReject(analysis.id)}
                            className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analysis.status === "approved" && (
                  <Card className="border-purple-500/30 bg-purple-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-purple-400 shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold text-[var(--foreground)]">
                            Fix Approved
                          </h3>
                          <p className="text-[10px] text-[var(--foreground-secondary)] mt-0.5">
                            This code patch has been approved. Apply the fix to automatically update the affected workspace files.
                          </p>
                        </div>
                        <div className="flex shrink-0">
                          <Button
                            size="sm"
                            onClick={() => onApplyFix(analysis.id)}
                            className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> Apply Fix
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <Card className="border-[var(--border)] bg-[var(--background-card)] flex-1">
          <CardContent className="flex flex-col items-center justify-center h-full text-center">
            <Clock className="h-6 w-6 text-[var(--foreground-tertiary)] mb-2" />
            <p className="text-xs text-[var(--foreground-secondary)]">
              Analysis pending — the AI is investigating this incident
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
