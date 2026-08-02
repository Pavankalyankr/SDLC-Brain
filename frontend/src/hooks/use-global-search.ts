import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  project_id?: string;
  project_name?: string;
  snippet?: string;
  description?: string;
  url?: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export function useGlobalSearch(query: string, projectId?: string) {
  return useQuery({
    queryKey: ["search", query, projectId],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const params = new URLSearchParams({ q: query });
      if (projectId) params.set("project_id", projectId);
      const data = await api.get<SearchResponse>(`/search?${params.toString()}`);
      // Map backend response to our SearchResult shape
      return (data.results || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        type: (r.type || "document").toLowerCase(),
        project_id: r.project_id || projectId || "",
        snippet: r.description || r.snippet || "",
        url: r.url,
      })) as SearchResult[];
    },
    enabled: query.length >= 2,
    retry: false,
  });
}
