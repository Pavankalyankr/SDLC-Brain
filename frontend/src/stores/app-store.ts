/**
 * SDLC Brain — Zustand App Store
 *
 * Global application state: sidebar, theme, model selector.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // AI Model
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // AI Panel
  aiPanelOpen: boolean;
  toggleAIPanel: () => void;
  setAIPanelOpen: (open: boolean) => void;

  // Command palette
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // AI Model
      selectedModel: "deepseek-r1",
      setSelectedModel: (model) => set({ selectedModel: model }),

      // AI Panel
      aiPanelOpen: false,
      toggleAIPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setAIPanelOpen: (open) => set({ aiPanelOpen: open }),

      // Command palette
      commandOpen: false,
      setCommandOpen: (open) => set({ commandOpen: open }),
    }),
    {
      name: "sdlc-brain-app-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        selectedModel: state.selectedModel,
      }),
    }
  )
);
