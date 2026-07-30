/**
 * SDLC Brain — Architecture API Hooks
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SystemDesign {
  id: string;
  project_id: string;
  title: string;
  description: string;
  architecture_type: string;
  components: string;
  mermaid_diagram: string | null;
  tech_stack: string;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  feedback: string | null;
  created_at: string;
  updated_at: string;
}

export interface APIContract {
  id: string;
  project_id: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  request_body: string | null;
  response_body: string | null;
  status_codes: string;
  service: string | null;
  status: string;
  confidence: number;
  created_at: string;
}

export interface DBSchemaItem {
  id: string;
  project_id: string;
  table_name: string;
  description: string;
  columns: string;
  relationships: string;
  mermaid_diagram: string | null;
  status: string;
  confidence: number;
  created_at: string;
}

export const archKeys = {
  designs: (pid: string) => ["arch", "designs", pid] as const,
  apis: (pid: string) => ["arch", "apis", pid] as const,
  schemas: (pid: string) => ["arch", "schemas", pid] as const,
};

export function useSystemDesigns(projectId: string) {
  return useQuery({
    queryKey: archKeys.designs(projectId),
    queryFn: () => api.get<SystemDesign[]>(`/architecture/designs/${projectId}`),
    enabled: !!projectId,
  });
}

export function useAPIContracts(projectId: string) {
  return useQuery({
    queryKey: archKeys.apis(projectId),
    queryFn: () => api.get<APIContract[]>(`/architecture/apis/${projectId}`),
    enabled: !!projectId,
  });
}

export function useDBSchemas(projectId: string) {
  return useQuery({
    queryKey: archKeys.schemas(projectId),
    queryFn: () => api.get<DBSchemaItem[]>(`/architecture/schemas/${projectId}`),
    enabled: !!projectId,
  });
}

export function useGenerateDesign(projectId: string) {
  return useMutation({
    mutationFn: (instructions?: string) =>
      api.post<{ task_id: string; status: string }>("/architecture/designs/generate", { project_id: projectId, instructions }),
  });
}

export function useGenerateAPIs(projectId: string) {
  return useMutation({
    mutationFn: (instructions?: string) =>
      api.post<{ task_id: string; status: string }>("/architecture/apis/generate", { project_id: projectId, instructions }),
  });
}

export function useGenerateDBSchemas(projectId: string) {
  return useMutation({
    mutationFn: (instructions?: string) =>
      api.post<{ task_id: string; status: string }>("/architecture/schemas/generate", { project_id: projectId, instructions }),
  });
}
