"use client";

/**
 * SDLC Brain — React Query Provider
 *
 * Wraps the app with QueryClientProvider for data fetching.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,   // 5 min — serve cached data instantly on revisit
            gcTime: 10 * 60 * 1000,      // 10 min — keep cache alive across module hops
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: "always",    // still refresh in background when stale
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
