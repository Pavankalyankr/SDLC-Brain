"use client";

import { Download, FileText, FileJson, Type } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ExportMenuProps {
  onExport: (format: "pdf" | "md" | "docx" | "json") => void;
  disabled?: boolean;
}

export function ExportMenu({ onExport, disabled }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 gap-2 bg-[var(--background-card)] border-[var(--border)] hover:bg-[var(--background-elevated)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48 bg-[var(--background-elevated)] border-[var(--border)]">
        <div className="px-2 py-1.5 text-xs font-semibold text-[var(--foreground-tertiary)]">Export Format</div>
        <DropdownMenuSeparator className="bg-[var(--border)]" />
        <DropdownMenuItem
          onSelect={() => onExport("pdf")}
          onClick={() => onExport("pdf")}
          className="gap-2 text-xs text-[var(--foreground)] focus:bg-[var(--background-card)] focus:text-[var(--foreground)] cursor-pointer"
        >
          <FileText className="h-4 w-4 text-red-400" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onExport("docx")}
          onClick={() => onExport("docx")}
          className="gap-2 text-xs text-[var(--foreground)] focus:bg-[var(--background-card)] focus:text-[var(--foreground)] cursor-pointer"
        >
          <Type className="h-4 w-4 text-blue-400" />
          Word Document (DOCX)
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onExport("md")}
          onClick={() => onExport("md")}
          className="gap-2 text-xs text-[var(--foreground)] focus:bg-[var(--background-card)] focus:text-[var(--foreground)] cursor-pointer"
        >
          <FileText className="h-4 w-4 text-emerald-400" />
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => onExport("json")}
          onClick={() => onExport("json")}
          className="gap-2 text-xs text-[var(--foreground)] focus:bg-[var(--background-card)] focus:text-[var(--foreground)] cursor-pointer"
        >
          <FileJson className="h-4 w-4 text-amber-400" />
          Raw JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
