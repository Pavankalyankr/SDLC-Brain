"use client";

/**
 * SDLC Brain — AI Thinking Animation
 *
 * Pulsing brain icon with streaming text effect.
 * Shown while AI is generating content.
 */

import { Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIThinkingProps {
  message?: string;
  streamedText?: string;
  className?: string;
}

export function AIThinking({
  message = "Analyzing...",
  streamedText,
  className,
}: AIThinkingProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--primary-muted)] bg-[var(--background-card)] p-6",
        "animate-fade-in",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-muted)] animate-pulse-glow">
            <Brain className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--primary)]">
            <Loader2 className="h-2.5 w-2.5 text-white animate-spin" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            AI is working
          </p>
          <p className="text-xs text-[var(--foreground-secondary)]">{message}</p>
        </div>
      </div>

      {/* Streamed Output */}
      {streamedText && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 font-mono text-xs leading-relaxed text-[var(--foreground-secondary)]">
          {streamedText}
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--primary)] animate-pulse" />
        </div>
      )}

      {/* Loading Dots */}
      {!streamedText && (
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-[var(--primary)]"
              style={{
                animation: `pulse-glow 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
