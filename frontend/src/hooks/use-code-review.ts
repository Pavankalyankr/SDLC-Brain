import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CodeReview {
  id: string;
  project_id: string;
  file_path: string;
  original_code: string;
  review_comments: string;
  severity: string;
  suggestions: string;
  score: number;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  created_at: string;
}

export const reviewKeys = {
  reviews: (pid: string) => ["code_review", "reviews", pid] as const,
};

export function useCodeReviews(projectId: string) {
  return useQuery({
    queryKey: reviewKeys.reviews(projectId),
    queryFn: () => api.get<CodeReview[]>(`/code-review/${projectId}`),
    enabled: !!projectId,
  });
}

export function useGenerateCodeReview(projectId: string) {
  return useMutation({
    mutationFn: () =>
      api.post<{ task_id: string; status: string }>("/code-review/generate", { project_id: projectId }),
  });
}
