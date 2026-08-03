"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface WebTerminalProps {
  projectId: string;
}

export function WebTerminal({ projectId }: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#0d0d0d", // Match IDE dark theme
        foreground: "#cccccc",
        cursor: "#8b5cf6",
        selectionBackground: "rgba(139, 92, 246, 0.3)",
      },
      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
      fontSize: 13,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    // Connect WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace("http", "ws")
      : "ws://localhost:8000/api/v1";
    
    const ws = new WebSocket(`${wsUrl}/development/ws/terminal/${projectId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln("\x1b[1;32mConnected to Development Sandbox.\x1b[0m\r\n");
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[1;31mConnection closed.\x1b[0m");
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Use ResizeObserver to detect panel resizing, not just window resizing
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore fit errors when container is too small or hidden
      }
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [projectId]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] rounded-xl overflow-hidden border border-[var(--border)] min-w-0 min-h-0">
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--background-card)] flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-[var(--foreground-secondary)] uppercase tracking-wider">
          Integrated Terminal
        </span>
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
        </div>
      </div>
      <div className="flex-1 relative min-h-0 overflow-hidden bg-[#0d0d0d]">
        <div className="absolute inset-0 p-2 overflow-hidden" ref={terminalRef}></div>
      </div>
    </div>
  );
}
