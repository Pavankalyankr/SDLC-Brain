"use client";

/**
 * SDLC Brain — Confidence Badge
 *
 * Displays AI confidence score as a percentage with color-coded bar.
 */

import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: number; // 0.0 to 1.0
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const percent = Math.round(confidence * 100);

  const getColor = () => {
    if (percent >= 90) return "var(--success)";
    if (percent >= 70) return "var(--primary)";
    if (percent >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="confidence-bar w-16">
        <div
          className="confidence-bar-fill"
          style={{ width: `${percent}%`, backgroundColor: getColor() }}
        />
      </div>
      <span
        className="text-[11px] font-medium tabular-nums"
        style={{ color: getColor() }}
      >
        {percent}%
      </span>
    </div>
  );
}
