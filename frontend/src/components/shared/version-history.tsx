"use client";

import { History, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/shared/status-badge";
import { motion, AnimatePresence } from "framer-motion";

interface Version {
  id: string;
  version: number;
  status: string;
  created_at: string;
  feedback?: string | null;
}

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  versions: Version[];
  currentVersion: number;
  onRestore: (versionId: string) => void;
}

export function VersionHistoryPanel({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onRestore,
}: VersionHistoryPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-[var(--border)] bg-[var(--background-card)] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--foreground-secondary)]" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Version History</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-elevated)]">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-[var(--border)]">
                {versions.map((v, i) => (
                  <div key={v.id} className="relative flex gap-4">
                    <div className="relative mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background-elevated)]">
                      <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--foreground)]">v{v.version}</span>
                          {v.version === currentVersion && (
                            <span className="text-[10px] bg-[var(--primary-muted)] text-[var(--primary)] px-1.5 py-0.5 rounded">Current</span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--foreground-tertiary)]">
                          {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <StatusBadge status={v.status} locked={v.status === "approved"} />
                      
                      {v.feedback && (
                        <div className="mt-1 rounded border border-amber-500/20 bg-amber-500/10 p-2">
                          <p className="text-[10px] text-amber-400">Feedback: {v.feedback}</p>
                        </div>
                      )}

                      {v.version !== currentVersion && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onRestore(v.id)}
                          className="mt-2 h-7 w-full text-[10px] border-[var(--border)] hover:bg-[var(--background-elevated)] text-[var(--foreground)]"
                        >
                          Restore this version
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
