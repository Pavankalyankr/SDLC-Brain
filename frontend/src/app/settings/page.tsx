"use client";

/**
 * SDLC Brain — Settings Page
 *
 * AI Configuration: models, providers, routing, connection testing.
 */

import { useState } from "react";
import {
  Settings,
  Bot,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const aiRouting = [
  { task: "agile", label: "Agile / Planning", model: "deepseek-r1", category: "Reasoning" },
  { task: "architecture", label: "Architecture", model: "deepseek-r1", category: "Reasoning" },
  { task: "development", label: "Development", model: "qwen3-coder", category: "Engineering" },
  { task: "qa", label: "QA & Testing", model: "qwen3-coder", category: "Engineering" },
  { task: "code_review", label: "Code Review", model: "qwen3-coder", category: "Engineering" },
  { task: "knowledge", label: "Knowledge", model: "qwen3-coder", category: "Engineering" },
  { task: "devops", label: "DevOps", model: "qwen3-coder", category: "Engineering" },
  { task: "production", label: "Production Support", model: "deepseek-r1", category: "Reasoning" },
];

export default function SettingsPage() {
  const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({});

  const testConnection = (provider: string) => {
    setConnectionStatus({ ...connectionStatus, [provider]: "testing" });
    setTimeout(() => {
      setConnectionStatus({ ...connectionStatus, [provider]: "connected" });
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-elevated)]">
          <Settings className="h-5 w-5 text-[var(--foreground-secondary)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Settings</h1>
          <p className="text-sm text-[var(--foreground-secondary)]">
            AI models, providers, and task routing configuration
          </p>
        </div>
      </div>

      {/* Providers */}
      <Card className="border-[var(--border)] bg-[var(--background-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
            <Zap className="h-4 w-4 text-[var(--warning)]" />
            AI Providers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-[var(--background)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">NVIDIA NIM</p>
              <p className="text-xs text-[var(--foreground-secondary)]">Primary inference provider</p>
            </div>
            <div className="flex items-center gap-3">
              {connectionStatus.nvidia === "connected" ? (
                <Badge className="gap-1 bg-[var(--success-muted)] text-[var(--success)] border-0 text-xs">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              ) : connectionStatus.nvidia === "testing" ? (
                <Badge className="gap-1 bg-[var(--warning-muted)] text-[var(--warning)] border-0 text-xs">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Testing...
                </Badge>
              ) : (
                <Badge className="gap-1 bg-[var(--background-elevated)] text-[var(--foreground-tertiary)] border-0 text-xs">
                  <XCircle className="h-3 w-3" /> Not tested
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnection("nvidia")}
                className="h-7 text-xs border-[var(--border)] text-[var(--foreground-secondary)]"
              >
                Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Routing */}
      <Card className="border-[var(--border)] bg-[var(--background-card)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <Bot className="h-4 w-4 text-[var(--primary)]" />
              Task → Model Routing
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs border-[var(--border)] text-[var(--foreground-secondary)]"
            >
              <RefreshCw className="h-3 w-3" /> Reload Config
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {aiRouting.map((route) => (
              <div
                key={route.task}
                className="flex items-center justify-between rounded-lg bg-[var(--background)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--foreground)]">{route.label}</span>
                  <Badge
                    className={cn(
                      "text-[10px] border-0",
                      route.category === "Reasoning"
                        ? "bg-[hsl(280,40%,15%)] text-[hsl(280,70%,60%)]"
                        : "bg-[var(--success-muted)] text-[var(--success)]"
                    )}
                  >
                    {route.category}
                  </Badge>
                </div>
                <Select defaultValue={route.model}>
                  <SelectTrigger className="h-8 w-44 text-xs border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--background-elevated)] border-[var(--border)]">
                    <SelectItem value="deepseek-r1" className="text-xs text-[var(--foreground)]">DeepSeek-R1</SelectItem>
                    <SelectItem value="qwen3-coder" className="text-xs text-[var(--foreground)]">Qwen3-Coder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-[var(--border)] bg-[var(--background-card)]">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[var(--foreground-secondary)]">
              SDLC Brain v0.1.0 — MVP Prototype
            </div>
            <div className="text-xs text-[var(--foreground-tertiary)]">
              Open Source • MIT License
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
