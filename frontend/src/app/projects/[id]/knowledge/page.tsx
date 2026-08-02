"use client";

/**
 * SDLC Brain — Knowledge Management Page
 *
 * Search across all project artifacts: requirements, stories, APIs,
 * architecture, code, and documents using the backend search API.
 */

import { useState } from "react";
import { use } from "react";
import {
  BookOpen,
  Search,
  ClipboardList,
  Network,
  Code2,
  FileText,
  Layers,
  Loader2,
  Sparkles,
  ArrowRight,
  TestTube2,
  GitPullRequest,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGlobalSearch, type SearchResult } from "@/hooks/use-global-search";

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; label: string }> = {
  requirement:  { icon: ClipboardList, color: "text-[var(--primary)]",  bg: "bg-[var(--primary-muted)]",   label: "Requirement" },
  epic:         { icon: Layers,         color: "text-violet-400",         bg: "bg-violet-500/10",            label: "Epic" },
  feature:      { icon: Sparkles,       color: "text-amber-400",          bg: "bg-amber-500/10",             label: "Feature" },
  story:        { icon: ClipboardList,  color: "text-emerald-400",        bg: "bg-emerald-500/10",           label: "Story" },
  architecture: { icon: Network,        color: "text-violet-400",         bg: "bg-violet-500/10",            label: "Architecture" },
  api:          { icon: ArrowRight,     color: "text-cyan-400",           bg: "bg-cyan-500/10",              label: "API" },
  schema:       { icon: Layers,         color: "text-teal-400",           bg: "bg-teal-500/10",              label: "DB Schema" },
  code:         { icon: Code2,          color: "text-emerald-400",        bg: "bg-emerald-500/10",           label: "Code" },
  test_case:    { icon: TestTube2,      color: "text-amber-400",          bg: "bg-amber-500/10",             label: "Test" },
  review:       { icon: GitPullRequest, color: "text-pink-400",           bg: "bg-pink-500/10",              label: "Review" },
  document:     { icon: FileText,       color: "text-[var(--primary)]",   bg: "bg-[var(--primary-muted)]",   label: "Document" },
};

const CATEGORIES = [
  { key: "all",         label: "All" },
  { key: "requirement", label: "Requirements" },
  { key: "story",       label: "Stories" },
  { key: "architecture",label: "Architecture" },
  { key: "code",        label: "Code" },
  { key: "document",    label: "Documents" },
];

export default function KnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: results = [], isLoading, isFetching } = useGlobalSearch(query, projectId);

  const filtered =
    activeCategory === "all"
      ? results
      : results.filter((r) => r.type === activeCategory);

  const typeCount = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
          <BookOpen className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Knowledge Base</h1>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Search across all project artifacts
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-tertiary)]" />
        {(isLoading || isFetching) && query.length >= 2 && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-tertiary)] animate-spin" />
        )}
        <Input
          placeholder="Search requirements, stories, APIs, code, documents..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11 pr-11 h-12 bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-tertiary)] text-sm focus:border-[var(--primary)]"
          autoFocus
        />
      </div>

      {/* Category Filters */}
      {results.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const count = cat.key === "all" ? results.length : (typeCount[cat.key] || 0);
            if (cat.key !== "all" && count === 0) return null;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  activeCategory === cat.key
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)] hover:text-[var(--foreground)]"
                )}
              >
                {cat.label}
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] px-1 rounded-full",
                    activeCategory === cat.key ? "bg-white/20" : "bg-[var(--background-elevated)]"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      {query.length < 2 ? (
        /* Empty/Prompt State */
        <Card className="border-[var(--border)] bg-[var(--background-card)]">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
              <Search className="h-8 w-8 text-[var(--foreground-tertiary)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Search your project knowledge</h3>
            <p className="text-xs text-[var(--foreground-secondary)] max-w-sm">
              Type at least 2 characters to search across requirements, epics, features, stories, API contracts, database schemas, generated code, and documents.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {["user authentication", "payment API", "database schema", "test cases"].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-[var(--background-elevated)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-1/2 rounded mb-2" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-[var(--border)] bg-[var(--background-card)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
              <Search className="h-7 w-7 text-[var(--foreground-tertiary)]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">No results for "{query}"</h3>
            <p className="text-xs text-[var(--foreground-secondary)]">
              Try different keywords or generate more artifacts first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[var(--foreground-tertiary)] mb-3">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
          </p>
          {filtered.map((result) => (
            <SearchResultCard key={result.id} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const config = TYPE_CONFIG[result.type] || TYPE_CONFIG["document"];
  const Icon = config.icon;

  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--primary)]/50 transition-colors group cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", config.bg)}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                {result.title}
              </h3>
              <Badge className={cn("text-[10px] border-0 shrink-0", config.bg, config.color)}>
                {config.label}
              </Badge>
            </div>
            {result.snippet && (
              <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed line-clamp-2">
                {result.snippet}
              </p>
            )}
            {result.project_name && (
              <p className="text-[10px] text-[var(--foreground-tertiary)] mt-1">{result.project_name}</p>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-[var(--foreground-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
        </div>
      </CardContent>
    </Card>
  );
}
