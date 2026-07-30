"use client";

/**
 * SDLC Brain — Architecture Page
 *
 * System Design + API Contracts + DB Schema with Mermaid diagrams.
 * Gate: requires approved stories from the Agile module.
 */

import { useState } from "react";
import { use } from "react";
import {
  Layers,
  Sparkles,
  Server,
  Globe,
  Database,
  ChevronDown,
  ChevronRight,
  Code2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ReviewToolbar } from "@/components/shared/review-toolbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { AIThinking } from "@/components/shared/ai-thinking";
import { MermaidDiagram } from "@/components/shared/mermaid-diagram";
import {
  useSystemDesigns,
  useAPIContracts,
  useDBSchemas,
  useGenerateDesign,
  useGenerateAPIs,
  useGenerateDBSchemas,
  archKeys,
} from "@/hooks/use-architecture";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400",
  POST: "bg-blue-500/20 text-blue-400",
  PUT: "bg-amber-500/20 text-amber-400",
  PATCH: "bg-orange-500/20 text-orange-400",
  DELETE: "bg-red-500/20 text-red-400",
};

export default function ArchitecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [activeTab, setActiveTab] = useState("design");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: designs = [] } = useSystemDesigns(projectId);
  const { data: apis = [] } = useAPIContracts(projectId);
  const { data: schemas = [] } = useDBSchemas(projectId);

  const genDesign = useGenerateDesign(projectId);
  const genAPIs = useGenerateAPIs(projectId);
  const genSchemas = useGenerateDBSchemas(projectId);

  const queryClient = useQueryClient();
  const { startStream, isGenerating } = useAIGeneration();

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    let promise;
    let queryKeyFactory: (pid: string) => readonly string[];

    if (activeTab === "design") {
      promise = genDesign.mutateAsync(undefined);
      queryKeyFactory = archKeys.designs;
    } else if (activeTab === "apis") {
      promise = genAPIs.mutateAsync(undefined);
      queryKeyFactory = archKeys.apis;
    } else if (activeTab === "database") {
      promise = genSchemas.mutateAsync(undefined);
      queryKeyFactory = archKeys.schemas;
    }

    if (promise && queryKeyFactory!) {
      try {
        const res = await promise as { task_id?: string };
        if (res.task_id) {
          await startStream(res.task_id, "/architecture", () => {
            queryClient.invalidateQueries({ queryKey: queryKeyFactory!(projectId) });
          });
        }
      } catch (err) {
        // Errors handled by mutation hook toasts
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Layers className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Architecture Assist</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              System Design → API Contracts → Database Schema
            </p>
          </div>
        </div>
        <ReviewToolbar
          status="draft"
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          onChat={() => {}}
          onEdit={() => {}}
          onApprove={() => {}}
          onHistory={() => {}}
          onRegenerate={handleGenerate}
          onExport={(f) => console.log("Export:", f)}
        />
      </div>

      {isGenerating && <AIThinking message={`Generating ${activeTab}...`} />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--background-card)] border border-[var(--border)]">
          {[
            { value: "design", label: "System Design", icon: Server, count: designs.length },
            { value: "apis", label: "API Contracts", icon: Globe, count: apis.length },
            { value: "database", label: "DB Schema", icon: Database, count: schemas.length },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-2 text-xs data-[state=active]:bg-[var(--background-elevated)] data-[state=active]:text-[var(--foreground)] text-[var(--foreground-secondary)]"
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              <Badge variant="secondary" className="h-5 min-w-5 text-[10px] bg-[var(--background)] text-[var(--foreground-tertiary)]">
                {tab.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* System Design */}
        <TabsContent value="design" className="mt-4 space-y-4">
          {designs.length > 0 ? (
            designs.map((design) => (
              <Card key={design.id} className="border-[var(--border)] bg-[var(--background-card)]">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">{design.title}</h3>
                      <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">{design.architecture_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge confidence={design.confidence} />
                      <StatusBadge status={design.status} locked={design.locked} />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">{design.description}</p>

                  {/* Mermaid Diagram */}
                  {design.mermaid_diagram && (
                    <div>
                      <p className="text-[10px] font-medium text-[var(--foreground-tertiary)] uppercase tracking-wider mb-2">Architecture Diagram</p>
                      <MermaidDiagram code={design.mermaid_diagram} />
                    </div>
                  )}

                  {/* Components */}
                  {design.components && design.components !== "[]" && (
                    <div>
                      <p className="text-[10px] font-medium text-[var(--foreground-tertiary)] uppercase tracking-wider mb-2">Components</p>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {(JSON.parse(design.components) as Array<{ name: string; type: string; tech: string; description: string }>).map(
                          (comp, i) => (
                            <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Server className="h-3 w-3 text-[var(--primary)]" />
                                <span className="text-xs font-medium text-[var(--foreground)]">{comp.name}</span>
                              </div>
                              <p className="text-[10px] text-[var(--foreground-tertiary)]">{comp.tech}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tech Stack */}
                  {design.tech_stack && design.tech_stack !== "{}" && (
                    <div>
                      <p className="text-[10px] font-medium text-[var(--foreground-tertiary)] uppercase tracking-wider mb-2">Tech Stack</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(JSON.parse(design.tech_stack) as Record<string, string>).map(([key, val]) => (
                          <Badge key={key} className="text-[10px] bg-[var(--background)] text-[var(--foreground-secondary)] border border-[var(--border)]">
                            {key}: {val}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              title="No system design generated"
              description="Generate a system architecture from your approved user stories."
              onAction={() => genDesign.mutate(undefined)}
              loading={genDesign.isPending}
            />
          )}
        </TabsContent>

        {/* API Contracts */}
        <TabsContent value="apis" className="mt-4 space-y-2">
          {apis.length > 0 ? (
            apis.map((endpoint) => {
              const expanded = expandedIds.has(endpoint.id);
              return (
                <Card key={endpoint.id} className="border-[var(--border)] bg-[var(--background-card)]">
                  <CardContent className="p-3">
                    <button onClick={() => toggleExpand(endpoint.id)} className="w-full flex items-center gap-3 text-left">
                      {expanded ? <ChevronDown className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" /> : <ChevronRight className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />}
                      <Badge className={cn("text-[10px] font-mono px-2 py-0.5 border-0", METHOD_COLORS[endpoint.method] || "bg-gray-500/20 text-gray-400")}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-xs font-mono text-[var(--foreground)]">{endpoint.path}</code>
                      <span className="text-xs text-[var(--foreground-tertiary)] ml-2 truncate">{endpoint.summary}</span>
                      {endpoint.service && (
                        <Badge className="ml-auto text-[10px] bg-[var(--background)] text-[var(--foreground-tertiary)] border border-[var(--border)]">
                          {endpoint.service}
                        </Badge>
                      )}
                    </button>
                    {expanded && (
                      <div className="mt-3 ml-7 space-y-2 animate-fade-in">
                        <p className="text-xs text-[var(--foreground-secondary)]">{endpoint.description}</p>
                        {endpoint.request_body && (
                          <div>
                            <p className="text-[10px] font-medium text-[var(--foreground-tertiary)] mb-1">Request Body</p>
                            <pre className="text-[10px] text-[var(--foreground-secondary)] bg-[var(--background)] p-2 rounded font-mono overflow-x-auto">
                              {endpoint.request_body}
                            </pre>
                          </div>
                        )}
                        {endpoint.response_body && (
                          <div>
                            <p className="text-[10px] font-medium text-[var(--foreground-tertiary)] mb-1">Response Body</p>
                            <pre className="text-[10px] text-[var(--foreground-secondary)] bg-[var(--background)] p-2 rounded font-mono overflow-x-auto">
                              {endpoint.response_body}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <EmptyState
              title="No API contracts generated"
              description="Approve a system design first, then generate API contracts."
              onAction={() => genAPIs.mutate(undefined)}
              loading={genAPIs.isPending}
            />
          )}
        </TabsContent>

        {/* DB Schema */}
        <TabsContent value="database" className="mt-4 space-y-3">
          {schemas.length > 0 ? (
            schemas.map((table) => {
              const expanded = expandedIds.has(table.id);
              const columns = JSON.parse(table.columns) as Array<{ name: string; type: string; nullable: boolean; primary_key: boolean; description: string }>;
              return (
                <Card key={table.id} className="border-[var(--border)] bg-[var(--background-card)]">
                  <CardContent className="p-4">
                    <button onClick={() => toggleExpand(table.id)} className="w-full flex items-center gap-3 text-left">
                      {expanded ? <ChevronDown className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" /> : <ChevronRight className="h-3.5 w-3.5 text-[var(--foreground-tertiary)]" />}
                      <Database className="h-4 w-4 text-[var(--primary)]" />
                      <code className="text-xs font-mono font-semibold text-[var(--foreground)]">{table.table_name}</code>
                      <span className="text-xs text-[var(--foreground-tertiary)] truncate">{table.description}</span>
                      <Badge className="ml-auto text-[10px] bg-[var(--background)] text-[var(--foreground-tertiary)] border border-[var(--border)]">
                        {columns.length} columns
                      </Badge>
                    </button>
                    {expanded && (
                      <div className="mt-3 ml-7 space-y-3 animate-fade-in">
                        {/* Column Table */}
                        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-[var(--background)]">
                                <th className="text-left p-2 text-[var(--foreground-tertiary)] font-medium">Column</th>
                                <th className="text-left p-2 text-[var(--foreground-tertiary)] font-medium">Type</th>
                                <th className="text-left p-2 text-[var(--foreground-tertiary)] font-medium">Nullable</th>
                                <th className="text-left p-2 text-[var(--foreground-tertiary)] font-medium">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {columns.map((col, i) => (
                                <tr key={i} className="border-t border-[var(--border)]">
                                  <td className="p-2 font-mono text-[var(--foreground)]">
                                    {col.primary_key && <span className="text-amber-400 mr-1">🔑</span>}
                                    {col.name}
                                  </td>
                                  <td className="p-2 font-mono text-[var(--primary)]">{col.type}</td>
                                  <td className="p-2 text-[var(--foreground-tertiary)]">{col.nullable ? "YES" : "NO"}</td>
                                  <td className="p-2 text-[var(--foreground-secondary)]">{col.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {table.mermaid_diagram && <MermaidDiagram code={table.mermaid_diagram} />}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <EmptyState
              title="No database schema generated"
              description="Approve a system design first, then generate the database schema."
              onAction={() => genSchemas.mutate(undefined)}
              loading={genSchemas.isPending}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ title, description, onAction, loading }: {
  title: string; description: string; onAction: () => void; loading: boolean;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)]">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--background-elevated)] border border-[var(--border)] mb-4">
          <Layers className="h-7 w-7 text-[var(--foreground-tertiary)]" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">{title}</h3>
        <p className="text-xs text-[var(--foreground-secondary)] mb-6 max-w-sm">{description}</p>
        <Button onClick={onAction} disabled={loading} className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white">
          <Sparkles className={cn("h-4 w-4", loading && "animate-spin")} />
          {loading ? "Generating..." : "Generate"}
        </Button>
      </CardContent>
    </Card>
  );
}
