"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FileExplorer } from "@/components/development/file-explorer";
import { CodeEditor } from "@/components/development/code-editor";
import { AgentChat } from "@/components/development/agent-chat";
import { useDevelopmentScope, DevelopmentSourceSelector } from "./components";

export default function DevelopmentPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  const {
    selectedStage,
    selectedItemId,
    setSelectedStage,
    setSelectedItemId,
  } = useDevelopmentScope(projectId);

  return (
    <div className="flex-1 flex flex-col pt-1 pb-4 px-4 overflow-hidden min-h-0 w-full h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Autonomous Development Studio
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">
            Build, test, and run code directly in the sandbox with AI assistance.
          </p>
        </div>
      </div>

      {/* Target Agile Scope Selector */}
      <div className="mb-4 shrink-0">
        <DevelopmentSourceSelector
          projectId={projectId}
          selectedStage={selectedStage}
          selectedItemId={selectedItemId}
          onStageChange={setSelectedStage}
          onItemChange={setSelectedItemId}
        />
      </div>

      {/* Main 3-Pane Layout Wrapper */}
      <div className="flex-1 w-full min-h-0 flex gap-4 relative overflow-hidden">
        
        {/* LEFT: File Explorer (Fixed Width) */}
        <div className="w-72 shrink-0 h-full relative overflow-hidden flex flex-col">
          <FileExplorer projectId={projectId} onFileSelect={setSelectedFile} />
        </div>

        {/* CENTER: Code Editor (Full Height & Flexible Width) */}
        <div className="flex-1 min-w-0 h-full relative overflow-hidden flex flex-col">
          <CodeEditor projectId={projectId} selectedFile={selectedFile} />
        </div>

        {/* RIGHT: Agent Chat (Fixed Width) */}
        <div className="w-96 shrink-0 h-full relative overflow-hidden flex flex-col">
          <AgentChat projectId={projectId} />
        </div>

      </div>
    </div>
  );
}
