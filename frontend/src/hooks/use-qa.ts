import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  created_at: string;
}

export function useTestCases(projectId: string) {
  return useQuery({
    queryKey: ["test_cases", projectId],
    queryFn: async () => {
      const res = await api.get<TestCase[]>(`/qa/test-cases/${projectId}`);
      return res as TestCase[];
    },
    enabled: !!projectId,
  });
}

export function useGenerateTestCases(projectId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ task_id: string; status: string }>(`/qa/generate`, {
        project_id: projectId,
      });
      return res as { task_id: string; status: string };
    },
  });
}
