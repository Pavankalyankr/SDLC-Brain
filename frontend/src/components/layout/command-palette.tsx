"use client";

/**
 * SDLC Brain — Command Palette (Ctrl+K)
 *
 * Global search across all artifact types.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import { useGlobalSearch } from "@/hooks/use-global-search";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FolderKanban,
  ClipboardList,
  Network,
  Code2,
  TestTube2,
  BookOpen,
  Settings,
  LayoutDashboard,
} from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const { commandOpen, setCommandOpen } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading } = useGlobalSearch(searchQuery);

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandOpen, setCommandOpen]);

  const navigate = (href: string) => {
    router.push(href);
    setCommandOpen(false);
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput
        placeholder="Search projects, stories, APIs, documents..."
        className="text-[var(--foreground)]"
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty className="text-[var(--foreground-secondary)] text-sm py-6 text-center">
          {isLoading ? "Searching..." : "No results found."}
        </CommandEmpty>

        {searchQuery.length > 2 && searchResults && searchResults.length > 0 && (
          <CommandGroup heading="Search Results">
            {searchResults.map((result: any) => (
              <CommandItem key={result.id} onSelect={() => navigate(result.url || `/projects`)} className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-sm text-[var(--foreground)]">{result.title}</span>
                  <span className="text-[10px] uppercase bg-[var(--background-elevated)] px-1.5 py-0.5 rounded text-[var(--foreground-secondary)] border border-[var(--border)]">{result.type}</span>
                </div>
                {result.description && (
                  <span className="text-xs text-[var(--foreground-tertiary)] truncate w-full">{result.description}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {!searchQuery && (
          <>
            <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate("/")} className="gap-3">
            <LayoutDashboard className="h-4 w-4 text-[var(--foreground-secondary)]" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/projects")} className="gap-3">
            <FolderKanban className="h-4 w-4 text-[var(--foreground-secondary)]" />
            <span>Projects</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")} className="gap-3">
            <Settings className="h-4 w-4 text-[var(--foreground-secondary)]" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Modules">
          <CommandItem onSelect={() => navigate("/projects")} className="gap-3">
            <ClipboardList className="h-4 w-4 text-[var(--foreground-secondary)]" />
            <span>Requirements</span>
            <span className="ml-auto text-[10px] text-[var(--foreground-tertiary)]">Agile</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/projects")} className="gap-3">
            <Network className="h-4 w-4 text-[var(--foreground-secondary)]" />
            <span>Architecture</span>
            <span className="ml-auto text-[10px] text-[var(--foreground-tertiary)]">Design</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/projects")} className="gap-3">
            <Code2 className="h-4 w-4 text-[var(--foreground-secondary)]" />
            <span>Development</span>
            <span className="ml-auto text-[10px] text-[var(--foreground-tertiary)]">Code</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/projects")} className="gap-3">
            <TestTube2 className="h-4 w-4 text-[var(--foreground-secondary)]" />
            <span>QA & Testing</span>
            <span className="ml-auto text-[10px] text-[var(--foreground-tertiary)]">Quality</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/projects")} className="gap-3">
            <BookOpen className="h-4 w-4 text-[var(--foreground-secondary)]" />
            <span>Knowledge</span>
            <span className="ml-auto text-[10px] text-[var(--foreground-tertiary)]">Search</span>
          </CommandItem>
          </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
