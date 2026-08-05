"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Sparkles, Settings, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentChatProps {
  projectId: string;
}

interface ChatMessage {
  role: "agent" | "user";
  content: string;
  isThinking?: boolean;
}

export function AgentChat({ projectId }: AgentChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "agent",
      content: "Hello! I am your Antigravity Autonomous Agent powered by Gemini Flash. I can read your complete existing project codebase, intelligently modify source files, and execute background shell commands in the system terminal to build and test your application.",
    }
  ]);
  const [busy, setBusy] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || busy) return;
    
    const userPrompt = input.trim();
    setInput("");
    setBusy(true);

    // Add user message
    setMessages(prev => [
      ...prev,
      { role: "user", content: userPrompt },
      { role: "agent", content: "⚡ Initializing Antigravity Agent and scanning workspace...", isThinking: true }
    ]);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.content
      }));

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_BASE}/development/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          instructions: userPrompt,
          chat_history: chatHistory
        })
      });

      if (!res.ok) throw new Error("Failed to communicate with AI orchestrator");
      const data = await res.json();
      const taskId = data.task_id;
      setCurrentTaskId(taskId);

      // Listen to SSE progress stream
      const eventSource = new EventSource(`${API_BASE}/development/stream/${taskId}`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "ai_thinking" && payload.data?.message) {
            setMessages(prev => {
              const list = [...prev];
              const last = list[list.length - 1];
              if (last && last.role === "agent" && last.isThinking) {
                const updatedLast = { ...last };
                const msg = payload.data.message;
                if (msg.startsWith("📝") || msg.startsWith("⚡") || msg.startsWith("💻")) {
                  updatedLast.content += `\n\n${msg}`;
                } else {
                  // If it's general thinking, replace the header or append if already has tool logs
                  if (updatedLast.content.includes("\n\n")) {
                    updatedLast.content += `\n💭 ${msg}`;
                  } else {
                    updatedLast.content = `💭 ${msg}`;
                  }
                }
                list[list.length - 1] = updatedLast;
              }
              return list;
            });
          } else if (payload.type === "ai_complete") {
            const count = payload.data?.count || 0;
            const chatMessage = payload.data?.message;
            setMessages(prev => {
              const list = [...prev];
              const last = list[list.length - 1];
              if (last && last.role === "agent") {
                if (last.content.includes("✅ Autonomous task completed")) {
                  return list;
                }
                
                const updatedLast = { ...last };
                let originalLogs = updatedLast.content.replace("⚡ Initializing Antigravity Agent and scanning workspace...", "").trim();
                if (originalLogs.startsWith("💭")) {
                   originalLogs = originalLogs.substring(2).trim();
                }
                
                let text = "";
                if (chatMessage) {
                  text += `${chatMessage}\n\n`;
                }
                
                if (originalLogs) {
                   text += `**Agent Logs:**\n${originalLogs}\n\n`;
                }
                text += `✅ Autonomous task completed! Synchronized ${count} file(s).`;
                updatedLast.content = text;
                updatedLast.isThinking = false;
                list[list.length - 1] = updatedLast;
              }
              return list;
            });
            eventSource.close();
            setBusy(false);
            setCurrentTaskId(null);
          } else if (payload.type === "ai_error") {
            const errorMsg = payload.data?.message || "Execution failed";
            setMessages(prev => {
              const list = [...prev];
              const last = list[list.length - 1];
              if (last && last.role === "agent") {
                last.content = `❌ Error during execution: ${errorMsg}`;
                last.isThinking = false;
              }
              return list;
            });
            eventSource.close();
            setBusy(false);
            setCurrentTaskId(null);
          }
        } catch (e) {
          console.error("Error parsing agent stream event:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setBusy(false);
        setCurrentTaskId(null);
      };

    } catch (err: any) {
      toast.error("Agent execution failed: " + err.message);
      setMessages(prev => {
        const list = [...prev];
        const last = list[list.length - 1];
        if (last && last.role === "agent") {
          last.content = `❌ Connection error: ${err.message}`;
          last.isThinking = false;
        }
        return list;
      });
      setBusy(false);
      setCurrentTaskId(null);
    }
  };

  const handleStop = async () => {
    if (!currentTaskId) return;
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      await fetch(`${API_BASE}/development/task/${currentTaskId}`, {
        method: "DELETE"
      });
      setMessages(prev => {
        const list = [...prev];
        const last = list[list.length - 1];
        if (last && last.role === "agent" && last.isThinking) {
          last.content = `🛑 Process forcefully stopped by user.\n\n` + last.content;
          last.isThinking = false;
        }
        return list;
      });
      setBusy(false);
      setCurrentTaskId(null);
    } catch (err) {
      toast.error("Failed to stop process");
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden min-w-0 min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--background-elevated)] flex justify-between items-center">
        <div className="flex items-center gap-2 font-semibold text-sm text-[var(--foreground)]">
          <Bot className="w-5 h-5 text-[var(--primary)]" />
          Dev Agent (Gemini Flash)
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            Active
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--foreground-tertiary)]">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-[var(--primary)] text-white" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"}`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] text-sm p-3.5 rounded-2xl leading-relaxed ${msg.role === "user" ? "bg-[var(--primary)] text-white rounded-tr-none shadow-sm" : "bg-[var(--background-elevated)] text-[var(--foreground)] border border-[var(--border)] rounded-tl-none shadow-sm"}`}>
              {msg.isThinking && (
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold mb-1 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing...
                </div>
              )}
              <div className="whitespace-pre-wrap font-sans text-[13px]">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--background)]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="E.g., Scaffold JWT auth middleware in Express..."
            disabled={busy}
            className="w-full bg-[var(--background-elevated)] border border-[var(--border)] text-[var(--foreground)] text-sm rounded-full py-2.5 pl-4 pr-12 outline-none focus:border-[var(--primary)] transition-colors placeholder:text-[var(--foreground-tertiary)] disabled:opacity-50"
          />
          {busy ? (
            <Button
              size="icon"
              onClick={handleStop}
              className="absolute right-1 h-7 w-7 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              title="Stop Processing"
            >
              <Square className="w-3 h-3 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-1 h-7 w-7 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
