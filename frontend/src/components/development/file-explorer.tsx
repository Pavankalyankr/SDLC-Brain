"use client";

import { useState, useEffect, useRef } from "react";
import { Folder, File, ChevronRight, ChevronDown, Code2, Upload, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface FileNode {
  path: string;
  name: string;
  is_dir: boolean;
}

interface FileExplorerProps {
  projectId: string;
  onFileSelect: (path: string) => void;
}

export function FileExplorer({ projectId, onFileSelect }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["."]));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/development/workspace/${projectId}/files`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load workspace files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleDelete = async (e: React.MouseEvent, file: FileNode) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${file.name}" from your workspace?`)) return;

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/development/workspace/${projectId}/file/${encodeURIComponent(file.path)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete item");
      toast.success(`Deleted ${file.name}`);
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to delete ${file.name}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    let count = 0;
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = file.webkitRelativePath || file.name;
        
        // Ignore OS X metadata, git history, and temporary junk
        if (path.includes("__MACOSX") || path.endsWith(".DS_Store") || path.includes("node_modules") || path.includes(".git/")) {
          continue;
        }
        
        const text = await file.text();
        
        await fetch(`${API_BASE}/development/workspace/${projectId}/file/${encodeURIComponent(path)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
        count++;
      }
      
      toast.success(`Successfully uploaded ${count} file(s) directly to workspace!`);
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (folderInputRef.current) folderInputRef.current.value = "";
    }
  };

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderTree = (parentPath: string = ".", level: number = 0) => {
    const levelFiles = files.filter(f => {
      if (parentPath === ".") return !f.path.includes("/");
      const prefix = parentPath + "/";
      return f.path.startsWith(prefix) && !f.path.substring(prefix.length).includes("/");
    });

    return levelFiles.sort((a, b) => {
      if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
      return a.is_dir ? -1 : 1;
    }).map(file => {
      const isExpanded = expandedDirs.has(file.path);
      return (
        <div key={file.path}>
          <div
            className={cn(
              "flex items-center justify-between px-2 py-1 hover:bg-[var(--background-elevated)] cursor-pointer text-xs transition-colors rounded-md group text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => file.is_dir ? toggleDir(file.path) : onFileSelect(file.path)}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              {file.is_dir ? (
                isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              {file.is_dir ? (
                <Folder className="w-4 h-4 text-blue-400 group-hover:text-blue-300 shrink-0" />
              ) : (
                <File className="w-4 h-4 text-[var(--foreground-tertiary)] group-hover:text-[var(--foreground)] shrink-0" />
              )}
              <span className="truncate">{file.name}</span>
            </div>
            <button
              type="button"
              onClick={(e) => handleDelete(e, file)}
              title={`Delete ${file.name} from workspace`}
              className="p-1 rounded bg-[var(--background-elevated)] hover:bg-red-500/20 border border-[var(--border)] hover:border-red-500/50 transition-all shrink-0 ml-1 flex items-center justify-center text-[var(--foreground-secondary)] hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
          {file.is_dir && isExpanded && renderTree(file.path, level + 1)}
        </div>
      );
    });
  };

  if (loading && files.length === 0) {
    return (
      <div className="relative flex flex-col w-full h-full overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] font-semibold text-sm flex items-center gap-2 shrink-0">
          <Code2 className="w-4 h-4 text-[var(--primary)]" />
          Workspace
        </div>
        <div className="p-4 flex flex-col gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-5 bg-[var(--background-elevated)] animate-pulse rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col w-full h-full bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden min-w-0 min-h-0">
      <div className="px-3 py-2.5 border-b border-[var(--border)] bg-[var(--background-elevated)] flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between font-semibold text-sm text-[var(--foreground)]">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[var(--primary)]" />
            Workspace
          </div>
          <span className="text-[10px] uppercase font-mono text-[var(--foreground-tertiary)] tracking-wider">Antigravity</span>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <input 
            type="file" 
            ref={folderInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            multiple 
            // @ts-ignore
            webkitdirectory="true"
            directory=""
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            multiple 
          />
          <button 
            type="button"
            className="w-full h-8 px-3 text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all border border-[var(--primary)]"
            onClick={() => folderInputRef.current?.click()}
            disabled={uploading}
            title="Open & import an existing project codebase folder from your computer"
          >
            <Folder className="w-4 h-4 text-yellow-300 shrink-0" />
            <span className="text-white font-semibold tracking-wide text-xs">Open Project Folder</span>
          </button>
          <button 
            type="button"
            className="w-full h-8 px-3 text-xs font-bold text-[var(--foreground)] bg-[var(--background-card)] hover:bg-[var(--background-hover)] border border-[var(--border)] rounded-lg flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Upload single or multiple files to workspace"
          >
            <Upload className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-[var(--foreground)] font-semibold tracking-wide text-xs">Upload Code Files</span>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col">
        {uploading && (
          <div className="p-2.5 mb-2 text-xs font-bold text-center text-white bg-emerald-600 rounded shadow border border-emerald-500 flex items-center justify-center gap-2 shrink-0 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white shrink-0" />
            <span>Uploading... Please wait</span>
          </div>
        )}
        {files.length === 0 && !uploading ? (
          <div className="p-4 my-auto flex flex-col items-center justify-center text-center gap-3 text-sm">
            <Folder className="w-10 h-10 text-yellow-400/60 stroke-[1.5]" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-[var(--foreground)]">No Codebase Open</h4>
              <p className="text-[11px] text-[var(--foreground-secondary)] leading-relaxed">
                Click <strong>Open Project</strong> above to open an existing folder from your machine for Gemini Flash to analyze & modify.
              </p>
            </div>
            <button
              type="button"
              className="mt-1 bg-blue-600 text-white hover:bg-blue-500 border border-blue-500 text-xs px-3 h-8 rounded flex items-center gap-1.5 shadow font-bold cursor-pointer"
              onClick={() => folderInputRef.current?.click()}
            >
              <Folder className="w-3.5 h-3.5 text-white fill-current/20" />
              <span>Open Existing Project Folder</span>
            </button>
          </div>
        ) : (
          renderTree(".", 0)
        )}
      </div>
    </div>
  );
}
