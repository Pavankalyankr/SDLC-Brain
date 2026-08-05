"use client";

import { useState } from "react";
import { use } from "react";
import {
  TestTube,
  Sparkles,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { AIThinking } from "@/components/shared/ai-thinking";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useQueryClient } from "@tanstack/react-query";
import { useTestCases, useGenerateTestCases, useUpdateTestCaseStatus, type TestCase } from "@/hooks/use-qa";
import { FileExplorer } from "@/components/development/file-explorer";
import { AgentChat } from "@/components/development/agent-chat";
import { useTargetScope, TargetScopeSelector } from "@/components/shared/target-scope-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CodeEditor } from "@/components/development/code-editor";

export default function QAPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { startStream, isGenerating } = useAIGeneration();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  const { data: tests = [], isLoading } = useTestCases(projectId);
  const genQA = useGenerateTestCases(projectId);
  const updateStatus = useUpdateTestCaseStatus(projectId);
  
  const {
    selectedStage,
    selectedItemId,
    setSelectedStage,
    setSelectedItemId,
  } = useTargetScope(projectId, "qa");

  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const handleGenerateTests = async () => {
    const targetName = selectedStage === "all" ? "Entire Project Workspace" : `${selectedStage}: ${selectedItemId}`;
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ["test_cases", projectId] });
      
    try {
      const res = await genQA.mutateAsync({
        target_stage: selectedStage,
        target_id: selectedStage === "all" ? undefined : selectedItemId,
        instructions: `Generate QA test cases for Agile target (${targetName}).`
      }) as { task_id?: string };
      if (res.task_id) {
        await startStream(res.task_id, "/qa", invalidate);
      }
    } catch {
      // Error handled by UI toasts
    } finally {
      invalidate();
    }
  };

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    const targetName = selectedStage === "all" ? "Entire Project Workspace" : `${selectedStage}: ${selectedItemId}`;
    toast.info(`Initiating autonomous test code generation for ${targetName}...`);
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/qa/generate-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          target_stage: selectedStage,
          target_id: selectedStage === "all" ? null : selectedItemId,
          instructions: `Generate test code based on the approved test cases for Agile target (${targetName}). Write test code files to the workspace.`
        })
      });

      if (!res.ok) throw new Error("Failed to queue test code generation task.");
      const data = await res.json();
      const taskId = data.task_id;
      
      const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ["test_cases", projectId] });

      await startStream(taskId, "/qa", invalidate);

    } catch (err: any) {
      toast.error(err.message || "Failed to start AI test code generation");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleApproveAll = async () => {
    const drafts = tests.filter((t: TestCase) => t.status === 'draft' && !t.locked);
    if (drafts.length === 0) return;
    
    toast.promise(
      Promise.all(drafts.map((t: TestCase) => 
        updateStatus.mutateAsync({ testCaseId: t.id, status: 'approved' })
      )),
      {
        loading: 'Approving all test cases...',
        success: 'All test cases approved!',
        error: 'Failed to approve some test cases'
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col pt-1 pb-4 px-4 overflow-hidden min-h-0 w-full h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <TestTube className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
              QA Assist Studio
            </h1>
            <p className="text-sm text-[var(--foreground-secondary)] mt-1">
              Generate test plans and autonomously write test code into your codebase.
            </p>
          </div>
        </div>
      </div>

      {/* Target Agile Scope Selector */}
      <div className="mb-4 shrink-0">
        <TargetScopeSelector
          projectId={projectId}
          moduleName="qa"
          title="Target Agile Scope for QA"
          selectedStage={selectedStage}
          selectedItemId={selectedItemId}
          onStageChange={setSelectedStage}
          onItemChange={setSelectedItemId}
          onAction={handleGenerateTests}
          actionLabel="Generate Test Cases"
          isActionLoading={isGenerating}
          secondaryAction={tests.some(t => t.status === 'approved') ? handleGenerateCode : undefined}
          secondaryActionLabel="Generate Test Code"
          isSecondaryActionLoading={isGeneratingCode}
        />
      </div>

      {/* Main 3-Pane Layout Wrapper */}
      <div className="flex-1 w-full min-h-0 flex gap-4 relative overflow-hidden">
        
        {/* LEFT: File Explorer (Fixed Width) */}
        <div className="w-72 shrink-0 h-full relative overflow-hidden flex flex-col">
          <FileExplorer projectId={projectId} onFileSelect={setSelectedFile} />
        </div>

        {/* CENTER: QA Test Cases (Flexible Width) */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden flex flex-col border border-[var(--border)] rounded-xl bg-[var(--background-card)] shadow-sm">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent">
            {isGenerating && <AIThinking message="Analyzing codebase and generating test cases..." />}

            {!isGenerating && tests.length > 0 && (
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Generated Test Cases</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleApproveAll}
                  disabled={!tests.some((t: TestCase) => t.status === 'draft' && !t.locked)}
                  className="h-8 text-xs border-[var(--success-muted)] text-[var(--success)] hover:bg-[var(--success-muted)]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Approve All
                </Button>
              </div>
            )}

            {!isGenerating && tests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
                  <TestTube className="h-7 w-7 text-[var(--foreground-tertiary)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">No tests generated</h3>
                <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-sm">
                  Upload your codebase on the left, select a target scope, and generate comprehensive test cases.
                </p>
              </div>
            ) : (
              tests.map((test: TestCase) => (
                <Card key={test.id} className="border-[var(--border)] bg-[var(--background-elevated)] transition-all hover:border-[var(--primary)] hover:shadow-md">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <ListChecks className="h-4 w-4 text-[var(--primary)] mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-[var(--foreground)]">{test.title}</h3>
                        <p className="text-xs text-[var(--foreground-secondary)] mt-1">{test.description}</p>
                        {test.code && (
                           <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                             <CheckCircle2 className="h-3 w-3" /> Test Code Generated
                           </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase font-semibold px-2 py-1 bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)] rounded-md">
                        {test.test_type}
                      </span>
                      <StatusBadge status={test.status} locked={test.locked} />
                      
                      {!test.locked && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-[var(--foreground-secondary)]">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[var(--background-elevated)] border-[var(--border)]">
                            <DropdownMenuItem
                              onClick={() => updateStatus.mutate({ testCaseId: test.id, status: "approved" })}
                              className="text-[var(--success)] focus:bg-[var(--success-muted)] focus:text-[var(--success)] cursor-pointer"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Approve Test Case
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Agent Chat (Fixed Width) */}
        <div className="w-96 shrink-0 h-full relative overflow-hidden flex flex-col">
          <AgentChat projectId={projectId} />
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
