"use client";

import { use } from "react";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewToolbar } from "@/components/shared/review-toolbar";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-muted)]">
            <BookOpen className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Knowledge Management</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">Search across all project artifacts</p>
          </div>
        </div>
        <ReviewToolbar status="draft" />
      </div>
      <Card className="border-[var(--border)] bg-[var(--background-card)]">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
            <BookOpen className="h-7 w-7 text-[var(--foreground-tertiary)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Coming Soon</h3>
          <p className="text-xs text-[var(--foreground-secondary)] max-w-sm">AI-powered knowledge base and artifact search.</p>
        </CardContent>
      </Card>
    </div>
  );
}
