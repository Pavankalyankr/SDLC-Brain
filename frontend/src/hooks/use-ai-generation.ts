/**
 * SDLC Brain — AI Generation Stream Hook
 *
 * Handles SSE streaming for all AI generation tasks.
 * Processes: ai_thinking, ai_token, ai_complete, ai_error, task_status, artifact_updated
 */

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface AIEventData {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamData, setStreamData] = useState("");
  const [thinkingMessage, setThinkingMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setStreamData("");
    setThinkingMessage("");
    setProgress(0);
  }, []);

  const startStream = useCallback(async (
    taskId: string,
    endpointPrefix: string = "/agile",
    onComplete?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    setIsGenerating(true);
    setStreamData("");
    setThinkingMessage("Starting AI engine...");
    setProgress(0);

    try {
      for await (const rawEvent of api.stream(`${endpointPrefix}/stream/${taskId}`)) {
        const event = rawEvent as AIEventData;

        switch (event.type) {
          case "ai_thinking":
            setThinkingMessage(event.data?.message || "Thinking...");
            break;

          case "ai_token":
            // Real-time token streaming
            const token = event.data?.token || "";
            setStreamData((prev) => prev + token);
            break;

          case "task_status":
            // Progress updates from background services
            if (event.data?.message) {
              setThinkingMessage(event.data.message);
            }
            if (typeof event.data?.progress === "number") {
              setProgress(event.data.progress);
            }
            // Check if the task_status signals completion
            if (event.data?.status === "complete" || event.data?.progress === 100) {
              setIsGenerating(false);
              setProgress(100);
              if (onComplete) onComplete(event.data);
            }
            break;

          case "artifact_updated":
            // Backend signals data has been saved — trigger cache invalidation
            setIsGenerating(false);
            setProgress(100);
            if (onComplete) onComplete(event.data);
            break;

          case "ai_complete":
            setIsGenerating(false);
            setProgress(100);
            if (onComplete) onComplete(event.data);
            break;

          case "ai_error":
            setIsGenerating(false);
            const errorMsg = event.data?.error || "Generation failed";
            toast.error(errorMsg);
            if (onError) onError(new Error(errorMsg));
            break;

          default:
            // Unknown event type — log and continue
            console.debug("[SSE] Unknown event:", event.type, event.data);
        }
      }
    } catch (err: any) {
      console.error("Stream error:", err);
      setIsGenerating(false);
      if (onError) onError(err);
    } finally {
      // Ensure isGenerating is cleared even if stream closes unexpectedly
      setIsGenerating((prev) => {
        if (prev) {
          console.warn("[SSE] Stream closed without completion signal");
        }
        return false;
      });
    }
  }, []);

  return {
    isGenerating,
    streamData,
    thinkingMessage,
    progress,
    reset,
    startStream,
  };
}
