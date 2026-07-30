"use client";

/**
 * SDLC Brain — File Upload Component
 *
 * Drag-and-drop file upload for SOW documents.
 * Supports PDF and DOCX files.
 */

import { useCallback, useState } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({
  onUpload,
  accept = ".pdf,.docx,.doc",
  maxSizeMB = 50,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  }, []);

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(
      (f) => f.size <= maxSizeMB * 1024 * 1024
    );
    setFiles(validFiles);
    onUpload(validFiles);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8",
          "transition-all duration-200 cursor-pointer",
          isDragging
            ? "border-[var(--primary)] bg-[var(--primary-muted)] scale-[1.01]"
            : "border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--border-strong)] hover:bg-[var(--background-hover)]"
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          isDragging ? "bg-[var(--primary)] bg-opacity-20" : "bg-[var(--background-elevated)]"
        )}>
          <Upload className={cn(
            "h-6 w-6",
            isDragging ? "text-[var(--primary)]" : "text-[var(--foreground-secondary)]"
          )} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--foreground)]">
            Drop your SOW document here
          </p>
          <p className="text-xs text-[var(--foreground-secondary)] mt-1">
            PDF or DOCX • Max {maxSizeMB}MB
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-4 py-3"
            >
              <FileText className="h-4 w-4 text-[var(--primary)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-[var(--foreground-tertiary)]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <CheckCircle className="h-4 w-4 text-[var(--success)] shrink-0" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(i)}
                className="h-6 w-6 p-0 text-[var(--foreground-tertiary)] hover:text-[var(--danger)]"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
