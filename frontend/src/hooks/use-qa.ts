/**
 * SDLC Brain — QA API Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface TestCase {
  id: string;
  project_id: string;
  title: string;
  description: string;
  test_type: string;
  preconditions: string | null;
  steps: string;
  expected_result: string;
  code: string | null;
  story_id: string | null;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const qaKeys = {
  testCases: (pid: string) => ["test_cases", pid] as const,
  testPlans: (pid: string) => ["test_plans", pid] as const,
};

export function useTestCases(projectId: string) {
  return useQuery({
    queryKey: qaKeys.testCases(projectId),
    queryFn: () => api.get<TestCase[]>(`/qa/test-cases/${projectId}`),
    enabled: !!projectId,
  });
}

export function useGenerateTestCases(projectId: string) {
  return useMutation({
    mutationFn: (data?: { instructions?: string }) =>
      api.post<{ task_id: string; status: string }>("/qa/generate", {
        project_id: projectId,
        ...data,
      }),
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate test cases");
    },
  });
}

export function useUpdateTestCaseStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ testCaseId, status }: { testCaseId: string; status: string }) =>
      api.patch(`/qa/test-cases/${testCaseId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qaKeys.testCases(projectId) });
      toast.success("Test case status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });
}
