/**
 * SDLC Brain — Production Support API Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface Incident {
  id: string;
  project_id: string;
  title: string;
  description: string;
  severity: string;       // "low" | "medium" | "high" | "critical"
  root_cause: string | null;
  resolution: string | null;
  ai_analysis: string | null;
  status: string;         // "open" | "investigating" | "resolved" | "closed"
  confidence: number;
  created_at: string;
  resolved_at: string | null;
}

export const prodKeys = {
  incidents: (pid: string) => ["production", "incidents", pid] as const,
  runbooks: (pid: string) => ["production", "runbooks", pid] as const,
};

export function useIncidents(projectId: string) {
  return useQuery({
    queryKey: prodKeys.incidents(projectId),
    queryFn: () => api.get<Incident[]>(`/production/incidents/${projectId}`),
    enabled: !!projectId,
  });
}

export function useAnalyzeIncident(projectId: string) {
  return useMutation({
    mutationFn: (data?: { description?: string; instructions?: string }) =>
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
    mutationFn: ({
      incidentId,
      status,
      resolution,
    }: {
      incidentId: string;
      status: string;
      resolution?: string;
    }) =>
      api.patch(`/production/incidents/${incidentId}/status`, { status, resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prodKeys.incidents(projectId) });
      toast.success("Incident status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update incident status");
    },
  });
}
