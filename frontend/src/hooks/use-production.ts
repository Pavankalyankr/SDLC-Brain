/**
 * SDLC Brain — Production API Hooks
 *
 * Full RCA pipeline:
 *   Incidents → Analyses → Runbooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface Incident {
  id: string;
  project_id: string;
  title: string;
  description: string;
  severity: string;
  service: string;
  raw_logs: string;
  root_cause: string | null;
  resolution: string | null;
  ai_analysis: string | null;
  status: string;
  confidence: number;
  created_at: string;
  resolved_at: string | null;
}

export interface IncidentAnalysis {
  id: string;
  incident_id: string;
  classification: string;
  root_cause: string;
  impact: string;
  affected_files: string;
  mitigation_runbook: string;
  proposed_fix: string;
  code_patch: string;
  confidence: number;
  status: string;
  created_at: string;
}

export interface Runbook {
  id: string;
  project_id: string;
  title: string;
  content: string;
  category: string;
  version: number;
  confidence: number;
  status: string;
  created_at: string;
}

export const productionKeys = {
  incidents: (pid: string) => ["production", "incidents", pid] as const,
  analyses: (iid: string) => ["production", "analyses", iid] as const,
  runbooks: (pid: string) => ["production", "runbooks", pid] as const,
};

export function useIncidents(projectId: string) {
  return useQuery({
    queryKey: productionKeys.incidents(projectId),
    queryFn: () => api.get<Incident[]>(`/production/incidents/${projectId}`),
    enabled: !!projectId,
  });
}

export function useAnalyses(incidentId: string) {
  return useQuery({
    queryKey: productionKeys.analyses(incidentId),
    queryFn: () => api.get<IncidentAnalysis[]>(`/production/analyses/${incidentId}`),
    enabled: !!incidentId,
  });
}

export function useRunbooks(projectId: string) {
  return useQuery({
    queryKey: productionKeys.runbooks(projectId),
    queryFn: () => api.get<Runbook[]>(`/production/runbooks/${projectId}`),
    enabled: !!projectId,
  });
}

export function useAnalyzeIncident(projectId: string) {
  return useMutation({
    mutationFn: (data: {
      title?: string;
      raw_logs?: string;
      severity?: string;
      service?: string;
      description?: string;
    }) =>
      api.post<{ task_id: string; status: string }>("/production/analyze", {
        project_id: projectId,
        ...data,
      }),
    onError: (error: any) => {
      toast.error(error.message || "Failed to analyze incident");
    },
  });
}

export function useUpdateIncidentStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, status, resolution }: { incidentId: string; status: string; resolution?: string }) =>
      api.patch(`/production/incidents/${incidentId}/status`, { status, resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.incidents(projectId) });
      toast.success("Incident status updated");
    },
  });
}

export function useUpdateAnalysisStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ analysisId, status }: { analysisId: string; status: string }) =>
      api.patch(`/production/analyses/${analysisId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production"] });
      toast.success("Analysis status updated");
    },
  });
}

export function useApplyFix() {
  return useMutation({
    mutationFn: (analysisId: string) =>
      api.post<{ task_id: string; status: string }>(`/production/apply-fix/${analysisId}`),
    onError: (error: any) => {
      toast.error(error.message || "Failed to apply fix");
    },
  });
}
