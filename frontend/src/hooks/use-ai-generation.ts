import { useState, useCallback } from "react";
import { api } from "@/lib/api";

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

  const startStream = useCallback(async (
    taskId: string, 
    endpointPrefix: string = "/agile",
    onComplete?: (result: any) => void,
    onError?: (error: any) => void
  ) => {
    setIsGenerating(true);
    setStreamData("");
    setThinkingMessage("Starting AI engine...");
    
    try {
      for await (const rawEvent of api.stream(`${endpointPrefix}/stream/${taskId}`)) {
        const event = rawEvent as AIEventData;
        
        if (event.type === "ai_thinking") {
          setThinkingMessage(event.data.message || "Thinking...");
        } else if (event.type === "ai_token") {
          const token = event.data?.token || "";
          setStreamData((prev) => prev + token);
        } else if (event.type === "ai_complete") {
          setIsGenerating(false);
          if (onComplete) onComplete(event.data);
          break;
        } else if (event.type === "ai_error") {
          setIsGenerating(false);
          const errorMsg = event.data?.error || "Generation failed";
          if (onError) onError(new Error(errorMsg));
          break;
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      setIsGenerating(false);
      if (onError) onError(err);
    }
  }, []);

  return {
    isGenerating,
    streamData,
    thinkingMessage,
    startStream
  };
}
