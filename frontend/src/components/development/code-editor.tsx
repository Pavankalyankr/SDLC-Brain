"use client";

import { useState, useEffect } from "react";
import { Save, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CodeEditorProps {
  projectId: string;
  selectedFile: string | null;
}

export function CodeEditor({ projectId, selectedFile }: CodeEditorProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setContent("");
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
      } catch (err) {
        console.error(err);
        toast.error("Failed to load file content");
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [projectId, selectedFile]);

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
    } catch (err) {
      console.error(err);
      toast.error("Failed to save file");
    } finally {
      setSaving(false);
    }
  };

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
        </div>
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

      {/* Editor Area */}
      <div className="flex-1 relative bg-[#1e1e1e]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--foreground-secondary)]">
            Loading...
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
