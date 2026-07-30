import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  project_id: string;
  project_name?: string;
  snippet?: string;
}

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query) return [];
      
      // Mock search results for MVP
      return [
        {
          id: "1",
          title: "User Authentication API",
          type: "architecture",
          project_id: "demo",
          project_name: "E-Commerce Platform",
          snippet: "POST /api/auth/login",
        },
        {
          id: "2",
          title: "Setup Payment Gateway",
          type: "story",
          project_id: "demo",
          project_name: "E-Commerce Platform",
          snippet: "As a user, I want to securely checkout...",
        },
        {
          id: "3",
          title: "Incident: Payment Gateway Timeout",
          type: "production",
          project_id: "demo",
          project_name: "E-Commerce Platform",
          snippet: "Stripe API taking > 5s to respond.",
        },
      ] as SearchResult[];
    },
    enabled: query.length > 2,
  });
}
