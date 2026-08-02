/**
 * SDLC Brain — Agile API Hooks
 *
 * React Query hooks for all agile operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

// --- Types ---

export interface Requirement {
  id: string;
  project_id: string;
  title: string;
  description: string;
  priority: string | null;
  category: string | null;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  feedback: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Epic {
  id: string;
  project_id: string;
  requirement_id: string | null;
  title: string;
  description: string;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  feedback: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;
  project_id: string;
  epic_id: string | null;
  title: string;
  description: string;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  feedback: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Story {
  id: string;
  project_id: string;
  feature_id: string | null;
  title: string;
  description: string;
  acceptance_criteria: string | null;
  story_points: number | null;
  sprint: string | null;
  priority: string | null;
  status: string;
  version: number;
  confidence: number;
  locked: boolean;
  feedback: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Query Keys ---

export const agileKeys = {
  requirements: (projectId: string) => ["agile", "requirements", projectId] as const,
  epics: (projectId: string) => ["agile", "epics", projectId] as const,
  features: (projectId: string) => ["agile", "features", projectId] as const,
  stories: (projectId: string) => ["agile", "stories", projectId] as const,
};

// --- Queries ---

export function useRequirements(projectId: string) {
  return useQuery({
    queryKey: agileKeys.requirements(projectId),
    queryFn: () => api.get<Requirement[]>(`/agile/requirements/${projectId}`),
    enabled: !!projectId,
  });
}

export function useEpics(projectId: string) {
  return useQuery({
    queryKey: agileKeys.epics(projectId),
    queryFn: () => api.get<Epic[]>(`/agile/epics/${projectId}`),
    enabled: !!projectId,
  });
}

export function useFeatures(projectId: string) {
  return useQuery({
    queryKey: agileKeys.features(projectId),
    queryFn: () => api.get<Feature[]>(`/agile/features/${projectId}`),
    enabled: !!projectId,
  });
}

export function useStories(projectId: string) {
  return useQuery({
    queryKey: agileKeys.stories(projectId),
    queryFn: () => api.get<Story[]>(`/agile/stories/${projectId}`),
    enabled: !!projectId,
  });
}

// --- Mutations ---

export function useGenerateRequirements(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { source_content?: string; instructions?: string }) =>
      api.post("/agile/requirements/generate", { project_id: projectId, ...data }),
    onSuccess: () => {
      // Stream completion handles invalidation
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate requirements");
    },
  });
}

export function useGenerateEpics(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: { instructions?: string }) =>
      api.post("/agile/epics/generate", { project_id: projectId, ...data }),
    onSuccess: () => {
      // Stream completion handles invalidation
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate epics");
    },
  });
}

export function useGenerateFeatures(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: { instructions?: string }) =>
      api.post("/agile/features/generate", { project_id: projectId, ...data }),
    onSuccess: () => {
      // Stream completion handles invalidation
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate features");
    },
  });
}

export function useGenerateStories(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: { instructions?: string }) =>
      api.post("/agile/stories/generate", { project_id: projectId, ...data }),
    onSuccess: () => {
      // Stream completion handles invalidation
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate stories");
    },
  });
}

export function useUpdateArtifactStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      id,
      status,
      feedback,
    }: {
      type: "requirements" | "epics" | "features" | "stories";
      id: string;
      status: string;
      feedback?: string;
    }) => api.patch(`/agile/${type}/${id}/status`, { status, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agile"] });
    },
  });
}

export function useUpdateStoryMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { priority?: string; story_points?: number; sprint?: string };
    }) => api.patch(`/agile/stories/${id}/metadata`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agile"] });
    },
  });
}
