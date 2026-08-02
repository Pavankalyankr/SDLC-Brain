"use client";

/**
 * SDLC Brain — App Shell
 *
 * Main application shell with sidebar, header, command palette,
 * and tooltip provider. Wraps all pages.
 */

import { Suspense, useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { QueryProvider } from "@/lib/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryProvider>
      <TooltipProvider delay={200}>
        {/* Navigation progress bar — instant visual feedback on route change */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div
            className={cn(
              "flex flex-1 flex-col transition-all duration-300",
              !mounted ? "ml-[260px]" : sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
            )}
          >
            {/* Header */}
            <Header />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto pt-14">
              <div className="p-6">{children}</div>
            </main>
          </div>

          {/* Command Palette (Ctrl+K) */}
          <CommandPalette />
        </div>
      </TooltipProvider>
    </QueryProvider>
  );
}
