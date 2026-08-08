"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, FileText, GitCompareArrows, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DiffViewer } from "@/components/development/diff-viewer";

interface CodeEditorProps {
  projectId: string;
  selectedFile: string | null;
  /** Optional: pre-loaded original code for diff comparison (e.g. from a code review) */
  originalCodeOverride?: string;
}

export function CodeEditor({ projectId, selectedFile, originalCodeOverride }: CodeEditorProps) {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setContent("");
      setOriginalContent("");
      setShowDiff(false);
      return;
    }

    const loadFile = async () => {
      setLoading(true);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${API_BASE}/development/workspace/${projectId}/file/${encodeURIComponent(selectedFile)}`);
        if (!res.ok) throw new Error("Failed to load file");
        let text = await res.text();
        try {
          const parsed = JSON.parse(text);
          if (typeof parsed === "string") {
            text = parsed;
          }
        } catch {
          // Response is already raw plain text
        }
        setContent(text);
        // If we have an original code override (from a review), use that.
        // Otherwise, the loaded content IS the original.
        if (originalCodeOverride) {
          setOriginalContent(originalCodeOverride);
          // Auto-show diff when there's original code and it differs
          if (originalCodeOverride !== text) {
            setShowDiff(true);
          }
        } else {
          setOriginalContent(text);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load file content");
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [projectId, selectedFile, originalCodeOverride]);

  const handleSave = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/development/workspace/${projectId}/file/${encodeURIComponent(selectedFile)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save file");
      toast.success("File saved successfully");
      // After saving, the saved content becomes the new "original"
      setOriginalContent(content);
      if (showDiff) setShowDiff(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const handleRevertHunk = useCallback((newContent: string) => {
    setContent(newContent);
    toast.success("Change reverted");
  }, []);

  const hasChanges = content !== originalContent;

  if (!selectedFile) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-[var(--background-elevated)] text-[var(--foreground-tertiary)] border border-[var(--border)] rounded-xl min-w-0 min-h-0 overflow-hidden text-center p-4">
        <FileText className="w-12 h-12 mb-4 opacity-50 shrink-0" />
        <p className="text-sm">Select a file from the explorer to view or edit.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--background-card)] rounded-xl overflow-hidden border border-[var(--border)] min-w-0 min-h-0">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--background-elevated)]">
        <div className="flex items-center gap-2 text-sm font-mono text-[var(--foreground)]">
          <FileText className="w-4 h-4 text-[var(--foreground-secondary)]" />
          {selectedFile}
          {hasChanges && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
              Modified
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Diff toggle button */}
          {hasChanges && (
            <Button
              size="sm"
              variant="outline"
              className={`h-7 text-xs gap-1.5 transition-colors ${
                showDiff
                  ? "bg-[#1f6feb22] text-[#58a6ff] border-[#1f6feb44] hover:bg-[#1f6feb33]"
                  : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? (
                <>
                  <Pencil className="w-3 h-3" />
                  Edit Mode
                </>
              ) : (
                <>
                  <GitCompareArrows className="w-3 h-3" />
                  Show Changes
                </>
              )}
            </Button>
          )}
          <Button 
            size="sm" 
            className="h-7 text-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white gap-1.5"
            onClick={handleSave}
            disabled={loading || saving}
          >
            <Save className="w-3 h-3" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Editor / Diff Area */}
      <div className="flex-1 relative bg-[#1e1e1e] min-h-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground-secondary)]">
            Loading...
          </div>
        ) : showDiff && hasChanges ? (
          <div className="absolute inset-0 overflow-auto">
            <DiffViewer
              originalCode={originalContent}
              modifiedCode={content}
              onRevertHunk={handleRevertHunk}
              fileName={selectedFile}
            />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="absolute inset-0 w-full h-full p-4 bg-transparent text-[#d4d4d4] font-mono text-sm resize-none outline-none focus:ring-0 leading-relaxed whitespace-pre overflow-auto"
            spellCheck={false}
            style={{ tabSize: 2 }}
          />
        )}
      </div>
    </div>
  );
}
