/**
 * SDLC Brain — DevOps API Hooks
 *
 * Hooks for the 3-step DevOps pipeline:
 *   1. Pipelines + Infra (Analyze & Generate)
 *   2. Image Versions (Container Registry)
 *   3. Release Notes (Release Assist)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

export interface ImageVersion {
  id: string;
  project_id: string;
  service_name: string;
  image_name: string;
  current_version: string;
  previous_version: string;
  tag_type: string;
  status: string;
  base_image: string;
  change_summary: string;
  created_at: string;
}

export interface ReleaseNote {
  id: string;
  project_id: string;
  version: string;
  release_notes: string;
  deploy_instructions: string;
  status: string;
  created_at: string;
}

export const devopsKeys = {
  pipelines: (pid: string) => ["devops", "pipelines", pid] as const,
  infra: (pid: string) => ["devops", "infra", pid] as const,
  images: (pid: string) => ["devops", "images", pid] as const,
  releases: (pid: string) => ["devops", "releases", pid] as const,
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

export function useImageVersions(projectId: string) {
  return useQuery({
    queryKey: devopsKeys.images(projectId),
    queryFn: () => api.get<ImageVersion[]>(`/devops/images/${projectId}`),
    enabled: !!projectId,
  });
}

export function useReleases(projectId: string) {
  return useQuery({
    queryKey: devopsKeys.releases(projectId),
    queryFn: () => api.get<ReleaseNote[]>(`/devops/releases/${projectId}`),
    enabled: !!projectId,
  });
}

export function useGenerateDevOps(projectId: string) {
  return useMutation({
    mutationFn: (data?: { instructions?: string }) =>
      api.post<{ task_id: string; status: string }>("/devops/generate", {
        project_id: projectId,
        ...data,
      }),
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate DevOps configs");
    },
  });
}

export function useGenerateRelease(projectId: string) {
  return useMutation({
    mutationFn: (data?: { version?: string; changes?: string }) =>
      api.post<{ task_id: string; status: string }>("/devops/generate-release", {
        project_id: projectId,
        ...data,
      }),
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate release notes");
    },
  });
}

export function useUpdatePipelineStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pipelineId, status }: { pipelineId: string; status: string }) =>
      api.patch(`/devops/pipelines/${pipelineId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: devopsKeys.pipelines(projectId) });
      toast.success("Pipeline status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update pipeline status");
    },
  });
}

export function useUpdateInfraStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ infraId, status }: { infraId: string; status: string }) =>
      api.patch(`/devops/infra/${infraId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: devopsKeys.infra(projectId) });
      toast.success("Infrastructure config status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update infra status");
    },
  });
}
