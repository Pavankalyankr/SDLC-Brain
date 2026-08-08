/**
 * SDLC Brain — Diff Computation Utility
 *
 * Line-level diff using a simplified LCS (Longest Common Subsequence) algorithm.
 * Groups consecutive changes into "hunks" so individual changes can be reverted.
 */

export type DiffLineType = "add" | "delete" | "context";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber: number | null; // null for added lines
  newLineNumber: number | null; // null for deleted lines
  hunkId: number;
}

export interface DiffHunk {
  id: number;
  startIndex: number; // index into the DiffLine[] array
  endIndex: number;
  lines: DiffLine[];
}

export interface DiffResult {
  lines: DiffLine[];
  hunks: DiffHunk[];
  hasChanges: boolean;
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
  };
}

/**
 * Compute the Longest Common Subsequence table for two arrays of strings.
 */
function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Backtrack through the LCS table to produce diff operations.
 */
function backtrack(
  dp: number[][],
  a: string[],
  b: string[],
  i: number,
  j: number
): Array<{ type: DiffLineType; oldIdx: number | null; newIdx: number | null; content: string }> {
  const result: Array<{
    type: DiffLineType;
    oldIdx: number | null;
    newIdx: number | null;
    content: string;
  }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.push({ type: "context", oldIdx: i, newIdx: j, content: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "add", oldIdx: null, newIdx: j, content: b[j - 1] });
      j--;
    } else if (i > 0) {
      result.push({
        type: "delete",
        oldIdx: i,
        newIdx: null,
        content: a[i - 1],
      });
      i--;
    }
  }

  return result.reverse();
}

/**
 * Group consecutive non-context lines into hunks.
 * Each hunk also includes up to `contextLines` surrounding context lines.
 */
function groupIntoHunks(lines: DiffLine[], contextLines = 3): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let hunkId = 0;

  // Find runs of changed lines
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type !== "context") {
      // Start of a change run
      const changeStart = i;

      // Extend to cover consecutive changes
      while (i < lines.length && lines[i].type !== "context") {
        i++;
      }
      const changeEnd = i;

      // Build hunk with context
      const hunkStart = Math.max(0, changeStart - contextLines);
      const hunkEnd = Math.min(lines.length, changeEnd + contextLines);

      const hunkLines = lines.slice(hunkStart, hunkEnd).map((l) => ({
        ...l,
        hunkId,
      }));

      hunks.push({
        id: hunkId,
        startIndex: hunkStart,
        endIndex: hunkEnd,
        lines: hunkLines,
      });

      hunkId++;
    } else {
      i++;
    }
  }

  // Assign hunkId to all diff lines
  for (const hunk of hunks) {
    for (let j = hunk.startIndex; j < hunk.endIndex; j++) {
      lines[j] = { ...lines[j], hunkId: hunk.id };
    }
  }

  return hunks;
}

/**
 * Compute a line-level diff between two strings.
 */
export function computeDiff(
  originalText: string,
  modifiedText: string
): DiffResult {
  const oldLines = originalText.split("\n");
  const newLines = modifiedText.split("\n");

  const dp = lcsTable(oldLines, newLines);
  const raw = backtrack(dp, oldLines, newLines, oldLines.length, newLines.length);

  let oldLineNum = 0;
  let newLineNum = 0;
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  const diffLines: DiffLine[] = raw.map((entry) => {
    if (entry.type === "context") {
      oldLineNum++;
      newLineNum++;
      unchanged++;
      return {
        type: "context" as DiffLineType,
        content: entry.content,
        oldLineNumber: oldLineNum,
        newLineNumber: newLineNum,
        hunkId: -1,
      };
    } else if (entry.type === "delete") {
      oldLineNum++;
      deletions++;
      return {
        type: "delete" as DiffLineType,
        content: entry.content,
        oldLineNumber: oldLineNum,
        newLineNumber: null,
        hunkId: -1,
      };
    } else {
      // add
      newLineNum++;
      additions++;
      return {
        type: "add" as DiffLineType,
        content: entry.content,
        oldLineNumber: null,
        newLineNumber: newLineNum,
        hunkId: -1,
      };
    }
  });

  const hunks = groupIntoHunks(diffLines);

  return {
    lines: diffLines,
    hunks,
    hasChanges: additions > 0 || deletions > 0,
    stats: { additions, deletions, unchanged },
  };
}

/**
 * Revert a specific hunk: given the original text, the modified text,
 * and the hunk to revert, produce a new text where that hunk's changes
 * are replaced with the original lines.
 */
export function revertHunk(
  originalText: string,
  modifiedText: string,
  hunkId: number
): string {
  const diff = computeDiff(originalText, modifiedText);
  const hunk = diff.hunks.find((h) => h.id === hunkId);
  if (!hunk) return modifiedText;

  // Collect the new line numbers that were added in this hunk (to remove)
  // and the old line numbers that were deleted (to restore)
  const addedNewLines = new Set<number>();
  const deletedOldLines: Array<{ oldLineNumber: number; content: string }> = [];

  for (const line of diff.lines) {
    if (line.hunkId === hunkId) {
      if (line.type === "add" && line.newLineNumber !== null) {
        addedNewLines.add(line.newLineNumber);
      } else if (line.type === "delete" && line.oldLineNumber !== null) {
        deletedOldLines.push({
          oldLineNumber: line.oldLineNumber,
          content: line.content,
        });
      }
    }
  }

  const modifiedLines = modifiedText.split("\n");
  const originalLines = originalText.split("\n");

  // Build the result by walking through the diff and reconstructing
  const resultLines: string[] = [];
  let newIdx = 0;

  for (const line of diff.lines) {
    if (line.hunkId === hunkId) {
      if (line.type === "delete") {
        // Restore deleted line
        resultLines.push(line.content);
      }
      // Skip added lines (they get removed by revert)
      // Context lines within the hunk pass through
      if (line.type === "context") {
        resultLines.push(line.content);
      }
    } else {
      if (line.type === "context" || line.type === "add") {
        resultLines.push(line.content);
      }
      // Deleted lines outside this hunk stay deleted
    }
  }

  return resultLines.join("\n");
}
