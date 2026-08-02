/**
 * SDLC Brain — Development API Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface CodeFile {
  id: string;
  project_id: string;
  file_path: string;
  language: string;
  content: string;
  description: string;
  story_id: string | null;
  component: string | null;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  feedback: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateCodeRequest {
  project_id: string;
  instructions?: string;
}

export const devKeys = {
  files: (pid: string) => ["development", "files", pid] as const,
};

export function useCodeFiles(projectId: string) {
  return useQuery({
    queryKey: devKeys.files(projectId),
    queryFn: () => api.get<CodeFile[]>(`/development/files/${projectId}`),
    enabled: !!projectId,
  });
}

export function useGenerateCode(projectId: string) {
  return useMutation({
    mutationFn: (data?: { instructions?: string }) =>
      api.post<{ task_id: string; status: string }>("/development/generate", {
        project_id: projectId,
        ...data,
      }),
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate code");
    },
  });
}

export function useUpdateCodeFileStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, status }: { fileId: string; status: string }) =>
      api.patch(`/development/files/${fileId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: devKeys.files(projectId) });
      toast.success("Code file status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });
}
