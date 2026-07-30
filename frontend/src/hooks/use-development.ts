import { useQuery, useMutation } from "@tanstack/react-query";
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
  created_at: string;
}

export const devKeys = {
  files: (pid: string) => ["dev", "files", pid] as const,
};

export function useCodeFiles(projectId: string) {
  return useQuery({
    queryKey: devKeys.files(projectId),
    queryFn: () => api.get<CodeFile[]>(`/development/files/${projectId}`),
    enabled: !!projectId,
  });
}

export function useGenerateCodeFiles(projectId: string) {
  return useMutation({
    mutationFn: (instructions?: string) =>
      api.post<{ task_id: string; status: string }>("/development/generate", { project_id: projectId, instructions }),
  });
}
