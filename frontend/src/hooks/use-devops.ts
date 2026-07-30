import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PipelineConfig {
  id: string;
  project_id: string;
  name: string;
  platform: string;
  config_content: string;
  description: string;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  created_at: string;
}

export interface InfraConfig {
  id: string;
  project_id: string;
  name: string;
  config_type: string;
  config_content: string;
  description: string;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  created_at: string;
}

export const devopsKeys = {
  pipelines: (pid: string) => ["devops", "pipelines", pid] as const,
  infra: (pid: string) => ["devops", "infra", pid] as const,
};

export function usePipelines(projectId: string) {
  return useQuery({
    queryKey: devopsKeys.pipelines(projectId),
    queryFn: () => api.get<PipelineConfig[]>(`/devops/pipelines/${projectId}`),
    enabled: !!projectId,
  });
}

export function useInfra(projectId: string) {
  return useQuery({
    queryKey: devopsKeys.infra(projectId),
    queryFn: () => api.get<InfraConfig[]>(`/devops/infra/${projectId}`),
    enabled: !!projectId,
  });
}

export function useGenerateDevOps(projectId: string) {
  return useMutation({
    mutationFn: () =>
      api.post<{ task_id: string; status: string }>("/devops/generate", { project_id: projectId }),
  });
}
