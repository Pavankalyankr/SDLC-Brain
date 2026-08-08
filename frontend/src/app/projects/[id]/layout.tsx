/**
 * SDLC Brain — Project Detail Layout
 *
 * Wraps all project sub-pages with project context.
 */

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" /></div>}>
      {children}
    </Suspense>
  );
}
