/**
 * SDLC Brain — Project API Hooks
 *
 * React Query hooks for project CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  filename: string;
  content_type: string;
  extracted_text: string | null;
  page_count: number | null;
  size_bytes: number;
  status: string;
  created_at: string;
}

const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
  documents: (id: string) => ["projects", id, "documents"] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => api.get<Project[]>("/projects"),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post<Project>("/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: projectKeys.documents(projectId),
    queryFn: () => api.get<Document[]>(`/documents/${projectId}`),
    enabled: !!projectId,
  });
}

export function useUploadDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<Document>(`/documents/${projectId}/upload`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.documents(projectId) });
    },
  });
}
