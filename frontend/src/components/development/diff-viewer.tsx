"use client";

import { useMemo, useCallback } from "react";
import { Undo2 } from "lucide-react";
import { computeDiff, revertHunk, type DiffLine, type DiffResult } from "@/lib/use-diff";

interface DiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  onRevertHunk?: (newContent: string) => void;
  fileName?: string;
}

export function DiffViewer({
  originalCode,
  modifiedCode,
  onRevertHunk,
  fileName,
}: DiffViewerProps) {
  const diff: DiffResult = useMemo(
    () => computeDiff(originalCode, modifiedCode),
    [originalCode, modifiedCode]
  );

  const handleRevert = useCallback(
    (hunkId: number) => {
      if (!onRevertHunk) return;
      const reverted = revertHunk(originalCode, modifiedCode, hunkId);
      onRevertHunk(reverted);
    },
    [originalCode, modifiedCode, onRevertHunk]
  );

  if (!diff.hasChanges) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[var(--foreground-tertiary)] p-8">
        <p className="text-sm">No changes detected</p>
      </div>
    );
  }

  // Find unique hunk IDs that have a revert button rendered
  const renderedHunkHeaders = new Set<number>();

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[#252526] shrink-0">
        <div className="flex items-center gap-4 text-xs">
          {fileName && (
            <span className="font-mono text-[var(--foreground-secondary)]">
              {fileName}
            </span>
          )}
          <span className="text-green-400 font-medium">
            +{diff.stats.additions} addition{diff.stats.additions !== 1 ? "s" : ""}
          </span>
          <span className="text-red-400 font-medium">
            -{diff.stats.deletions} deletion{diff.stats.deletions !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Diff lines */}
      <div className="flex-1 overflow-auto font-mono text-[13px] leading-[20px] select-text">
        <table className="w-full border-collapse">
          <tbody>
            {diff.lines.map((line, idx) => {
              // Determine if we should show a hunk revert header
              let showHunkHeader = false;
              if (
                line.hunkId >= 0 &&
                line.type !== "context" &&
                !renderedHunkHeaders.has(line.hunkId)
              ) {
                // Check if this is the first non-context line in this hunk
                const isFirst =
                  idx === 0 ||
                  diff.lines[idx - 1].hunkId !== line.hunkId ||
                  diff.lines[idx - 1].type === "context";
                if (isFirst) {
                  showHunkHeader = true;
                  renderedHunkHeaders.add(line.hunkId);
                }
              }

              return (
                <DiffLineRow
                  key={idx}
                  line={line}
                  showHunkHeader={showHunkHeader}
                  onRevert={onRevertHunk ? () => handleRevert(line.hunkId) : undefined}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiffLineRow({
  line,
  showHunkHeader,
  onRevert,
}: {
  line: DiffLine;
  showHunkHeader: boolean;
  onRevert?: () => void;
}) {
  const bgClass =
    line.type === "add"
      ? "bg-[#2ea04322]"
      : line.type === "delete"
      ? "bg-[#f8514922]"
      : "";

  const gutterBg =
    line.type === "add"
      ? "bg-[#2ea04333]"
      : line.type === "delete"
      ? "bg-[#f8514933]"
      : "";

  const textColor =
    line.type === "add"
      ? "text-[#3fb950]"
      : line.type === "delete"
      ? "text-[#f85149]"
      : "text-[#d4d4d4]";

  const marker =
    line.type === "add" ? "+" : line.type === "delete" ? "-" : " ";

  return (
    <>
      {showHunkHeader && (
        <tr className="bg-[#1f6feb22] border-y border-[#1f6feb44]">
          <td colSpan={4} className="px-3 py-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#58a6ff] font-medium">
                Change #{line.hunkId + 1}
              </span>
              {onRevert && (
                <button
                  onClick={onRevert}
                  className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-[#d29922] hover:text-[#e3b341] bg-[#d2992215] hover:bg-[#d2992230] border border-[#d2992230] rounded transition-colors"
                  title="Revert this change"
                >
                  <Undo2 className="w-3 h-3" />
                  Revert
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
      <tr className={`${bgClass} hover:brightness-110 transition-colors`}>
        {/* Old line number */}
        <td
          className={`${gutterBg} w-[52px] min-w-[52px] text-right pr-2 pl-2 select-none text-[#6e7681] text-[12px] align-top border-r border-[#30363d]`}
        >
          {line.oldLineNumber ?? ""}
        </td>
        {/* New line number */}
        <td
          className={`${gutterBg} w-[52px] min-w-[52px] text-right pr-2 pl-2 select-none text-[#6e7681] text-[12px] align-top border-r border-[#30363d]`}
        >
          {line.newLineNumber ?? ""}
        </td>
        {/* +/- marker */}
        <td
          className={`${gutterBg} w-[20px] min-w-[20px] text-center select-none ${textColor} font-bold align-top`}
        >
          {marker}
        </td>
        {/* Content */}
        <td className={`${textColor} whitespace-pre px-3 align-top`}>
          {line.content || "\u00A0"}
        </td>
      </tr>
    </>
  );
}
