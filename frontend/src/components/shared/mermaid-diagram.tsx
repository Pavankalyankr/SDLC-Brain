"use client";

/**
 * SDLC Brain — Mermaid Diagram Renderer
 *
 * Renders Mermaid diagrams from text using the mermaid library.
 * Falls back to showing the raw Mermaid code if rendering fails.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

export function MermaidDiagram({ code, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    let cancelled = false;

    async function render() {
      try {
        // Dynamic import so mermaid is only loaded when needed
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#6366f1",
            primaryTextColor: "#e2e8f0",
            primaryBorderColor: "#4f46e5",
            lineColor: "#64748b",
            secondaryColor: "#1e293b",
            tertiaryColor: "#0f172a",
            mainBkg: "#1e293b",
            nodeBorder: "#4f46e5",
            clusterBkg: "#0f172a",
            titleColor: "#e2e8f0",
            edgeLabelBackground: "#1e293b",
          },
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 13,
        });

        const id = `mermaid-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(id, code);

        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setSvg("");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (!code) return null;

  if (error) {
    return (
      <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--background)] p-4", className)}>
        <p className="text-[10px] text-[var(--warning)] mb-2">Mermaid rendering failed — showing raw code</p>
        <pre className="text-xs text-[var(--foreground-secondary)] font-mono whitespace-pre-wrap overflow-x-auto">
          {code}
        </pre>
      </div>
    );
  }

  if (svg) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 overflow-x-auto",
          "[&_svg]:max-w-full [&_svg]:h-auto",
          className
        )}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  // Loading
  return (
    <div className={cn("rounded-lg border border-[var(--border)] bg-[var(--background)] p-8 flex items-center justify-center", className)}>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}
