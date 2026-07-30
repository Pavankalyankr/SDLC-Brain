import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Incident {
  id: string;
  project_id: string;
  title: string;
  description: string;
  severity: string;
  root_cause: string | null;
  resolution: string | null;
  ai_analysis: string | null;
  status: string;
  confidence: number;
  created_at: string;
  resolved_at: string | null;
}

export const prodKeys = {
  incidents: (pid: string) => ["production", "incidents", pid] as const,
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
    mutationFn: (description?: string) =>
      api.post<{ task_id: string; status: string }>("/production/analyze", { project_id: projectId, description }),
  });
}
