"use client";

/**
 * SDLC Brain — Architecture Components & Source Selector
 *
 * Reusable visualization cards and dual-dropdown Agile Source Selector
 * for targeted system design, API contracts, and DB schema generation.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Server,
  Globe,
  Database,
  ChevronDown,
  ChevronRight,
  Code2,
  Layers,
  Filter,
  Sparkles,
  Layers3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MermaidDiagram } from "@/components/shared/mermaid-diagram";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import {
  useRequirements,
  useEpics,
  useFeatures,
  useStories,
} from "@/hooks/use-agile";
import {
  SystemDesign,
  APIContract,
  DBSchemaItem,
  useSystemDesigns,
  useAPIContracts,
  useDBSchemas,
} from "@/hooks/use-architecture";
import { cn } from "@/lib/utils";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PATCH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function useArchitectureScope(projectId: string) {
  const [selectedStage, setSelectedStageState] = useState<string>("all");
  const [selectedItemId, setSelectedItemIdState] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStage = localStorage.getItem(`sdlc_brain_arch_stage_${projectId}`);
      const savedItem = localStorage.getItem(`sdlc_brain_arch_item_${projectId}`);
      if (savedStage) {
        setSelectedStageState(savedStage);
      }
      if (savedItem) {
        setSelectedItemIdState(savedItem);
      }
    }
  }, [projectId]);

  const setSelectedStage = (stage: string) => {
    setSelectedStageState(stage);
    if (typeof window !== "undefined") {
      localStorage.setItem(`sdlc_brain_arch_stage_${projectId}`, stage);
      if (stage === "all") {
        localStorage.setItem(`sdlc_brain_arch_item_${projectId}`, "");
        setSelectedItemIdState("");
      } else {
        localStorage.removeItem(`sdlc_brain_arch_item_${projectId}`);
        setSelectedItemIdState("");
      }
    }
  };

  const setSelectedItemId = (itemId: string) => {
    setSelectedItemIdState(itemId);
    if (typeof window !== "undefined") {
      if (itemId) {
        localStorage.setItem(`sdlc_brain_arch_item_${projectId}`, itemId);
      } else {
        localStorage.removeItem(`sdlc_brain_arch_item_${projectId}`);
      }
    }
  };

  return { selectedStage, selectedItemId, setSelectedStage, setSelectedItemId };
}

interface SourceSelectorProps {
  projectId: string;
  selectedStage: string;
  selectedItemId: string;
  onStageChange: (stage: string) => void;
  onItemChange: (id: string) => void;
}

export function ArchitectureSourceSelector({
  projectId,
  selectedStage,
  selectedItemId,
  onStageChange,
  onItemChange,
}: SourceSelectorProps) {
  const { data: requirements = [] } = useRequirements(projectId);
  const { data: epics = [] } = useEpics(projectId);
  const { data: features = [] } = useFeatures(projectId);
  const { data: stories = [] } = useStories(projectId);

  const { data: designs = [] } = useSystemDesigns(projectId);
  const { data: contracts = [] } = useAPIContracts(projectId);
  const { data: schemas = [] } = useDBSchemas(projectId);

  const generatedIds = useMemo(() => new Set([
    ...designs.map((d) => d.source_id).filter(Boolean),
    ...contracts.map((c) => c.source_id).filter(Boolean),
    ...schemas.map((s) => s.source_id).filter(Boolean),
  ]), [designs, contracts, schemas]);

  const items =
    selectedStage === "all"
      ? []
      : selectedStage === "requirements"
      ? requirements.map((i) => ({ id: i.id, title: i.title, sub: `Priority: ${i.priority || "Normal"}` }))
      : selectedStage === "epics"
      ? epics.map((i) => ({ id: i.id, title: i.title, sub: "Epic" }))
      : selectedStage === "features"
      ? features.map((i) => ({ id: i.id, title: i.title, sub: "Feature" }))
      : stories.map((i) => ({ id: i.id, title: i.title, sub: `Pts: ${i.story_points || 0}` }));

  // Automatically pick the first generated item (or first item) if current selectedItemId is not valid for this stage
  useEffect(() => {
    if (selectedStage === "all") {
      if (selectedItemId !== "") {
        onItemChange("");
      }
      return;
    }

    if (items.length > 0 && (!selectedItemId || !items.some((i) => i.id === selectedItemId))) {
      const generatedItem = items.find((i) => generatedIds.has(i.id));
      onItemChange(generatedItem ? generatedItem.id : items[0].id);
    } else if (items.length === 0 && selectedItemId !== "") {
      onItemChange("");
    }
  }, [selectedStage, items, selectedItemId, onItemChange, generatedIds]);

  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)] overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-secondary)]">
            <Filter className="h-4 w-4 text-[var(--primary)]" />
            <span>Target Agile Scope for Architecture:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown 1: Agile Stage */}
            <div className="relative flex items-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mr-2">
                Stage:
              </span>
              <div className="relative">
                <select
                  value={selectedStage}
                  onChange={(e) => onStageChange(e.target.value)}
                  className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-1.5 pr-8 text-xs font-medium text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors"
                >
                  <option value="all">🌐 All Generated / Whole SOW</option>
                  <option value="requirements">Requirements ({requirements.length})</option>
                  <option value="epics">Epics ({epics.length})</option>
                  <option value="features">Features ({features.length})</option>
                  <option value="stories">Stories ({stories.length})</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground-secondary)]" />
              </div>
            </div>

            {/* Dropdown 2: Specific Item */}
            <div className="relative flex items-center min-w-[240px] max-w-full">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mr-2">
                Item:
              </span>
              <div className="relative flex-1">
                <select
                  value={selectedItemId}
                  onChange={(e) => onItemChange(e.target.value)}
                  disabled={selectedStage === "all" || items.length === 0}
                  className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-1.5 pr-8 text-xs font-medium text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors disabled:opacity-50 truncate"
                >
                  {selectedStage === "all" ? (
                    <option value="">Entire Project & All Items</option>
                  ) : items.length === 0 ? (
                    <option value="">No items found in {selectedStage}</option>
                  ) : (
                    items.map((item) => {
                      const isGen = generatedIds.has(item.id);
                      return (
                        <option key={item.id} value={item.id} className={isGen ? "text-emerald-400 font-semibold" : ""}>
                          {isGen ? "✓ [Generated] " : ""}{item.title} ({item.sub})
                        </option>
                      );
                    })
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--foreground-secondary)]" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemDesignCard({ design }: { design: SystemDesign }) {
  let components: Array<{ name: string; type: string; tech: string; description: string }> = [];
  try {
    components = JSON.parse(design.components || "[]");
  } catch {
    components = [];
  }

  let techStack: Record<string, string> = {};
  try {
    techStack = JSON.parse(design.tech_stack || "{}");
  } catch {
    techStack = {};
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--border-hover)] transition-all">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--foreground)]">{design.title}</h3>
              <Badge variant="secondary" className="text-[10px] uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {design.architecture_type}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceBadge confidence={design.confidence} />
            <StatusBadge status={design.status} locked={design.locked} />
          </div>
        </div>

        <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">{design.description}</p>

        {/* Tech Stack Chips */}
        {Object.keys(techStack).length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-2">Recommended Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(techStack).map(([category, tech]) => (
                <div key={category} className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2.5 py-1 text-xs flex items-center gap-1.5">
                  <span className="text-[10px] font-medium text-[var(--foreground-tertiary)] uppercase">{category}:</span>
                  <span className="font-semibold text-[var(--foreground)]">{String(tech)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mermaid Diagram */}
        {design.mermaid_diagram && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-2">Architecture Diagram</p>
            <MermaidDiagram code={design.mermaid_diagram} />
          </div>
        )}

        {/* Components */}
        {components && components.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-2">System Components ({components.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {components.map((comp, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 space-y-1.5 hover:border-[var(--primary-muted)] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span className="text-xs font-bold text-[var(--foreground)]">{comp.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[var(--border)] text-[var(--foreground-tertiary)]">
                      {comp.type}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[var(--foreground-secondary)] line-clamp-2">{comp.description}</p>
                  <div className="text-[10px] font-semibold text-[var(--primary-hover)] pt-1 border-t border-[var(--border)] mt-2">
                    Tech: {comp.tech}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function APIContractCard({ contract }: { contract: APIContract }) {
  const [expanded, setExpanded] = useState(false);
  const methodClass = METHOD_COLORS[contract.method.toUpperCase()] || "bg-gray-500/20 text-gray-400 border-gray-500/30";

  let statusCodes: Array<{ code: number | string; description: string }> = [];
  try {
    statusCodes = JSON.parse(contract.status_codes || "[]");
  } catch {
    statusCodes = [];
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)] overflow-hidden transition-all hover:border-[var(--border-hover)]">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--background-muted)]/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronRight className={cn("h-4 w-4 text-[var(--foreground-tertiary)] transition-transform duration-200 shrink-0", expanded && "rotate-90")} />
          <Badge className={cn("text-xs font-bold px-2 py-0.5 border shrink-0", methodClass)}>
            {contract.method}
          </Badge>
          <span className="font-mono text-xs md:text-sm font-semibold text-[var(--foreground)] truncate">
            {contract.path}
          </span>
          <span className="text-xs text-[var(--foreground-secondary)] truncate hidden sm:inline-block">
            — {contract.summary}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {contract.service && (
            <Badge variant="outline" className="text-[10px] font-mono text-[var(--foreground-secondary)] border-[var(--border)]">
              {contract.service}
            </Badge>
          )}
          <StatusBadge status={contract.status} />
        </div>
      </div>

      {expanded && (
        <CardContent className="p-5 border-t border-[var(--border)] bg-[var(--background)] space-y-4 text-xs animate-in slide-in-from-top-1 duration-200">
          <p className="text-[var(--foreground-secondary)] leading-relaxed">{contract.description || contract.summary}</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Request Body */}
            {contract.request_body && contract.request_body !== "null" && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-tertiary)]">Request Body Schema</p>
                <pre className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3 font-mono text-[11px] overflow-x-auto text-[var(--foreground-secondary)] max-h-60">
                  {formatJson(contract.request_body)}
                </pre>
              </div>
            )}

            {/* Response Body */}
            {contract.response_body && contract.response_body !== "null" && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-tertiary)]">Response Schema</p>
                <pre className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3 font-mono text-[11px] overflow-x-auto text-[var(--foreground-secondary)] max-h-60">
                  {formatJson(contract.response_body)}
                </pre>
              </div>
            )}
          </div>

          {/* Status Codes */}
          {statusCodes && statusCodes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-tertiary)]">HTTP Status Codes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {statusCodes.map((sc, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-card)] p-2">
                    <span className={cn("font-mono font-bold text-xs px-1.5 py-0.5 rounded", String(sc.code).startsWith("2") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                      {sc.code}
                    </span>
                    <span className="text-xs text-[var(--foreground-secondary)] truncate">{sc.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function DBSchemaCard({ schema }: { schema: DBSchemaItem }) {
  const [expanded, setExpanded] = useState(false);

  let columns: Array<{ name: string; type: string; nullable?: boolean; primary_key?: boolean; description?: string }> = [];
  try {
    columns = JSON.parse(schema.columns || "[]");
  } catch {
    columns = [];
  }

  let relationships: Array<{ column: string; references_table: string; references_column: string }> = [];
  try {
    relationships = JSON.parse(schema.relationships || "[]");
  } catch {
    relationships = [];
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)] overflow-hidden transition-all hover:border-[var(--border-hover)]">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--background-muted)]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronRight className={cn("h-4 w-4 text-[var(--foreground-tertiary)] transition-transform duration-200", expanded && "rotate-90")} />
          <Database className="h-4 w-4 text-[var(--primary)] shrink-0" />
          <span className="font-mono text-sm font-bold text-[var(--foreground)]">{schema.table_name}</span>
          <span className="text-xs text-[var(--foreground-secondary)] hidden md:inline-block truncate max-w-lg">
            — {schema.description}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] bg-[var(--background)] text-[var(--foreground-secondary)]">
            {columns.length} columns
          </Badge>
          <StatusBadge status={schema.status} />
        </div>
      </div>

      {expanded && (
        <CardContent className="p-5 border-t border-[var(--border)] bg-[var(--background)] space-y-5 animate-in slide-in-from-top-1 duration-200">
          <p className="text-xs text-[var(--foreground-secondary)]">{schema.description}</p>

          {/* Columns Table */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-tertiary)]">Table Columns</p>
            <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--background-card)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background-muted)] text-[11px] uppercase tracking-wider text-[var(--foreground-tertiary)] font-semibold">
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4 text-center">PK</th>
                    <th className="py-2.5 px-4 text-center">Nullable</th>
                    <th className="py-2.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {columns.map((col, idx) => (
                    <tr key={idx} className="hover:bg-[var(--background-muted)]/30 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-[var(--foreground)]">{col.name}</td>
                      <td className="py-2.5 px-4 font-mono text-violet-400">{col.type}</td>
                      <td className="py-2.5 px-4 text-center">
                        {col.primary_key ? <Badge className="text-[9px] px-1 py-0 bg-amber-500/20 text-amber-400 border border-amber-500/30">PK</Badge> : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-center text-[var(--foreground-tertiary)]">
                        {col.nullable ? "YES" : "NO"}
                      </td>
                      <td className="py-2.5 px-4 text-[var(--foreground-secondary)]">{col.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Relationships */}
          {relationships && relationships.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-tertiary)]">Foreign Key Relationships</p>
              <div className="flex flex-wrap gap-2">
                {relationships.map((rel, i) => (
                  <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-1.5 text-xs flex items-center gap-2 font-mono">
                    <span className="text-[var(--foreground)] font-semibold">{rel.column}</span>
                    <span className="text-[var(--foreground-tertiary)]">→</span>
                    <span className="text-emerald-400 font-semibold">{rel.references_table}.{rel.references_column}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mermaid Diagram */}
          {schema.mermaid_diagram && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-tertiary)] mb-2">Entity-Relationship Diagram</p>
              <MermaidDiagram code={schema.mermaid_diagram} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function ArchitectureEmptyState({
  title,
  description,
  onGenerate,
  disabled,
}: {
  title: string;
  description: string;
  onGenerate: () => void;
  disabled?: boolean;
}) {
  return (
    <Card className="border-[var(--border)] bg-[var(--background-card)]/50 border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
          <Sparkles className="h-6 w-6 text-violet-400 animate-pulse" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-base font-bold text-[var(--foreground)]">{title}</h3>
          <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">{description}</p>
        </div>
        <Button
          onClick={onGenerate}
          disabled={disabled}
          className="gap-2 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium text-xs shadow-lg shadow-[var(--primary)]/20"
        >
          <Sparkles className="h-4 w-4" />
          Generate for Selected Scope
        </Button>
      </CardContent>
    </Card>
  );
}

function formatJson(jsonString: string): string {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonString;
  }
}
