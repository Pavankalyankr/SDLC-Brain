/**
 * SDLC Brain — Code Review API Hooks
 *
 * NOTE: Backend routes use /reviews/{id} prefix to avoid FastAPI
 * path-param shadowing of the /stream/{task_id} SSE endpoint.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface CodeReview {
  id: string;
  project_id: string;
  file_path: string;
  original_code: string;
  review_comments: string; // JSON string array
  severity: string;        // "info" | "warning" | "error" | "critical"
  suggestions: string;     // JSON string array
  score: number;           // 0–100
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const reviewKeys = {
  reviews: (pid: string) => ["code_review", "reviews", pid] as const,
};

export function useCodeReviews(projectId: string) {
  return useQuery({
    queryKey: reviewKeys.reviews(projectId),
    // Backend route: GET /code-review/reviews/{project_id}
    queryFn: () => api.get<CodeReview[]>(`/code-review/reviews/${projectId}`),
    enabled: !!projectId,
  });
}

export function useGenerateCodeReview(projectId: string) {
  return useMutation({
    mutationFn: (data?: { instructions?: string }) =>
      api.post<{ task_id: string; status: string }>("/code-review/generate", {
        project_id: projectId,
        ...data,
      }),
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate code review");
    },
  });
}

export function useUpdateReviewStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // Backend route: PATCH /code-review/reviews/{review_id}/status
    mutationFn: ({ reviewId, status }: { reviewId: string; status: string }) =>
      api.patch(`/code-review/reviews/${reviewId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.reviews(projectId) });
      toast.success("Review status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update review status");
    },
  });
}
